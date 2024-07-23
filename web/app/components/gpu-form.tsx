import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { GPU, OutputCustomNodesJson, OutputModel } from "~/lib/types";
import { useFetcher } from "@remix-run/react";

export interface GpuFormProps {
  customNodesJson: OutputCustomNodesJson;
  modelsJson: OutputModel[];
  onBackStep: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export default function GpuForm({
  onBackStep,
  customNodesJson,
  modelsJson,
}: GpuFormProps) {
  const fetcher = useFetcher();
  const isCreatingMachine = fetcher.state !== "idle";
  return (
    <fetcher.Form action="/create-machine" method="post">
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Label htmlFor="machine-name">Machine Name</Label>
            <div className="mt-2">
              <Input
                type="text"
                id="machine-name"
                name="machine-name"
                placeholder="Machine name"
                required
              />
            </div>
          </div>
          <div className="sm:col-span-4">
            <Label>Select GPU</Label>
            <div className="mt-2">
              <GpuSelect gpus={Object.keys(GPU)} />
            </div>
          </div>
          <div className="sm:col-span-4 hidden">
            <Textarea
              placeholder="Type your message here."
              value={JSON.stringify(customNodesJson)}
              hidden
              id="custom-nodes"
              name="custom-nodes"
            />
            <Textarea
              placeholder="Type your message here."
              value={JSON.stringify(modelsJson)}
              id="models"
              name="models"
              hidden
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
        <Button onClick={onBackStep} disabled={isCreatingMachine}>
          Back
        </Button>
        <Button type="submit" disabled={isCreatingMachine}>
          Create Machine
        </Button>
      </div>
    </fetcher.Form>
  );
}

interface GpuComboBoxProps {
  gpus: string[];
}

function GpuSelect({ gpus }: GpuComboBoxProps) {
  return (
    <Select required name="gpu">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select GPU" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>GPUs</SelectLabel>
          {gpus.map((gpu) => (
            <SelectItem value={gpu} key={gpu}>
              {gpu}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
