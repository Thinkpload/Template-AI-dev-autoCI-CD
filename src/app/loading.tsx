import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-[#0f0a1a]">
      {/* Sidebar skeleton — desktop only */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </aside>
      {/* Main content skeleton */}
      <div className="flex flex-col flex-1 lg:pl-64">
        <div className="h-16 border-b border-white/10 flex items-center px-6">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
