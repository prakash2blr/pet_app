"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      type="button"
    >
      <Copy size={17} />
      {copied ? "Copied" : "Copy Caregiver Link"}
    </button>
  );
}
