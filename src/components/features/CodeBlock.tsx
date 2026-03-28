'use client';

import { useState } from 'react';

export function CodeBlock({ command, prefix = '$' }: { command: string; prefix?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-purple-900/50 bg-[#0f0a1a]/80 px-5 py-3.5">
      {prefix && <span className="select-none font-mono text-purple-500">{prefix}</span>}
      <code className="flex-1 text-left font-mono text-sm text-purple-100">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy command"
        className="ml-2 rounded-md border border-purple-900/50 bg-purple-950/60 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-900/40 hover:text-purple-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}
