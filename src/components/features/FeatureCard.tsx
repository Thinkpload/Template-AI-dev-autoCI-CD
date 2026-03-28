interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  variant?: 'sm' | 'lg';
}

export function FeatureCard({ icon, title, description, variant = 'sm' }: FeatureCardProps) {
  if (variant === 'lg') {
    return (
      <div className="flex gap-5 rounded-xl border border-purple-900/50 bg-purple-950/20 p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-purple-900/50 bg-purple-950/40 text-2xl">
          {icon}
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold text-purple-100">{title}</h3>
          <p className="text-sm leading-relaxed text-purple-300">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-xl border border-purple-900/50 bg-purple-950/20 p-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-purple-900/50 bg-purple-950/40 text-2xl">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-purple-100">{title}</h3>
      <p className="text-sm leading-relaxed text-purple-300">{description}</p>
    </div>
  );
}
