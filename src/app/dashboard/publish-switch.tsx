"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { setPublished } from "./actions";

export function PublishSwitch({ published }: { published: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(published);
  const [pending, startTransition] = useTransition();

  function toggle(value: boolean) {
    startTransition(async () => {
      setOptimistic(value);
      const result = await setPublished(value);
      if (result.ok) toast.success(value ? "Página publicada" : "Página despublicada");
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Switch id="publish" checked={optimistic} onCheckedChange={toggle} disabled={pending} />
      <Label htmlFor="publish">{optimistic ? "Página publicada" : "Publicar página"}</Label>
    </div>
  );
}
