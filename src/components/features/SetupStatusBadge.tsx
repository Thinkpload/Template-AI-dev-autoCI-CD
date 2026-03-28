export type SetupStatus = 'installed' | 'installing' | 'skipped' | 'failed';

interface SetupStatusBadgeProps {
  status: SetupStatus;
  label: string;
}

const STATUS_CONFIG: Record<SetupStatus, { color: string; icon: string; bg: string }> = {
  installed: { icon: '✓', color: 'text-green-400', bg: 'bg-green-950/40 border-green-900/50' },
  installing: { icon: '⋯', color: 'text-yellow-400', bg: 'bg-yellow-950/40 border-yellow-900/50' },
  skipped: { icon: '—', color: 'text-gray-400', bg: 'bg-gray-900/40 border-gray-700/50' },
  failed: { icon: '✗', color: 'text-red-400', bg: 'bg-red-950/40 border-red-900/50' },
};

export function SetupStatusBadge({ status, label }: SetupStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}
      data-status={status}
    >
      <span aria-hidden="true">{config.icon}</span>
      {label}
    </span>
  );
}
