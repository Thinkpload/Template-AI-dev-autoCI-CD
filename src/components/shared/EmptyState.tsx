import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({
  title,
  description,
  ctaLabel = 'Get started',
  ctaHref = '#',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {/* Decorative illustration */}
      <div className="text-6xl mb-6" aria-hidden="true">
        📋
      </div>
      <h2 className="text-xl font-semibold text-gray-100 mb-2">{title}</h2>
      {description && <p className="text-gray-400 mb-6 max-w-sm">{description}</p>}
      <Link href={ctaHref} className={cn(buttonVariants(), 'min-h-11')}>
        {ctaLabel}
      </Link>
    </div>
  );
}
