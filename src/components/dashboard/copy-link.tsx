"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Link da página pública com botões de copiar e abrir. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const display = url.replace(/^https?:\/\//, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-md border bg-background py-1 pr-1 pl-3 text-sm">
      <span className="min-w-0 flex-1 truncate" title={url}>
        {display}
      </span>
      <Button variant="ghost" size="icon" className="size-7" onClick={copy} aria-label={copied ? "Copiado" : "Copiar link"}>
        {copied ? <Check /> : <Copy />}
      </Button>
      <Button variant="ghost" size="icon" className="size-7" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Abrir página em nova aba">
          <ExternalLink />
        </a>
      </Button>
    </div>
  );
}
