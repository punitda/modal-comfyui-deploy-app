import subprocess
import shutil
import json
import os
from config import config

from modal import (App, gpu, Image, web_server, build, enter, Secret)
from helpers import (models_volume, MODELS_PATH, MOUNT_PATH,
                     download_models, move_clip_vision_files,  unzip_insight_face_models)


current_directory = os.path.dirname(os.path.realpath(__file__))

default_dependencies = "comfy-cli==1.0.34"
additional_dependencies = config["additional_dependencies"]
dependencies_str = default_dependencies if not additional_dependencies else f"{default_dependencies}, {additional_dependencies}"
dependencies: list[str] = [item.strip()
                           for item in dependencies_str.split(',')]

comfyui_image = (Image.debian_slim(python_version="3.10")
                 .apt_install("git")
                 .pip_install(dependencies)
                 .run_commands("comfy --skip-prompt install --nvidia")
                 .copy_local_file(f"{current_directory}/custom_nodes.json", "/root/")
                 .run_commands("comfy --skip-prompt node install-deps --deps=/root/custom_nodes.json")
                 .copy_local_file(f"{current_directory}/models.json", "/root/")
                 )

machine_name = config["machine_name"]
gpu_config = config["gpu"]


app = App(
    machine_name,
    image=comfyui_image,
    volumes={
        MOUNT_PATH: models_volume
    },
    secrets=[Secret.from_name("civitai-secret")]
)


@app.cls(
    gpu=gpu_config,
    image=comfyui_image,
    timeout=300,
    container_idle_timeout=300,
    allow_concurrent_inputs=100,
    # Restrict to 1 container because we want to our ComfyUI session state
    # to be on a single container.
    concurrency_limit=1,
)
class ComfyWorkflow:
    @build()
    def download(self):
        with open("/root/models.json", 'r', encoding='utf-8') as file:
            models = json.load(file)
            downloaded = download_models(models, os.environ["CIVITAI_TOKEN"])
            move_clip_vision_files()
            unzip_insight_face_models()
            if downloaded:
                models_volume.commit()
                print(
                    "Copying models to correct directory - This might take a few more seconds")
                shutil.copytree(
                    MODELS_PATH, "/root/comfy/ComfyUI/models", dirs_exist_ok=True)
                print("Models copied!!")

    def _run_comfyui_server(self, port=8188):
        cmd = f"comfy --skip-prompt launch -- --listen 0.0.0.0 --port {port}"
        subprocess.Popen(cmd, shell=True)

    @web_server(8188, startup_timeout=60)
    def ui(self):
        self._run_comfyui_server()
