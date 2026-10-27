// Skeleton shown while a screen's data loads (patchy 4G).
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-9 w-2/3 animate-pulse rounded-board bg-line" />
      <div className="h-12 animate-pulse rounded-board bg-line/70" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-board border-2 border-line bg-surface">
          <div className="h-10 animate-pulse bg-board-soft" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-line/70" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-line/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
