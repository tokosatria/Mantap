export default function SkeletonCard() {
  return (
    <div className="card flex flex-col h-full overflow-hidden">
      {/* Skeleton Image */}
      <div className="relative overflow-hidden bg-[var(--bg-elevated)]">
        <div className="w-full aspect-[4/3]">
          <div className="skeleton-shimmer w-full h-full" />
        </div>

        {/* Skeleton Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="w-12 h-5 rounded-md bg-[var(--bg-card)] opacity-50" />
        </div>
        <div className="absolute top-2 right-2">
          <div className="w-12 h-5 rounded-md bg-[var(--bg-card)] opacity-50" />
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Skeleton Title */}
        <div className="h-4 sm:h-5 rounded bg-[var(--bg-elevated)] mb-2 opacity-50 w-4/5" />
        <div className="h-4 sm:h-5 rounded bg-[var(--bg-elevated)] mb-3 opacity-50 w-3/5" />

        {/* Skeleton Rating & Sold */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded opacity-50">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[var(--bg-card)]" />
            <div className="w-6 h-3 sm:w-8 sm:h-4 rounded bg-[var(--bg-card)]" />
          </div>
          <div className="w-16 h-3 sm:h-4 rounded bg-[var(--bg-elevated)] opacity-50" />
        </div>

        {/* Skeleton Price */}
        <div className="mt-auto">
          <div className="h-5 sm:h-6 rounded bg-[var(--bg-elevated)] opacity-50 w-2/5 mb-1" />
          <div className="h-3 sm:h-4 rounded bg-[var(--bg-elevated)] opacity-50 w-1/3" />
        </div>
      </div>
    </div>
  );
}
