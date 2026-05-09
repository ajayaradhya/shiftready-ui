export default function MarketplaceLoading() {
  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="h-8 w-56 bg-surface-container-high rounded animate-pulse mb-2" />
      <div className="h-4 w-80 bg-surface-container rounded animate-pulse mb-8" />
      <div className="flex gap-3 mb-8">
        <div className="h-10 flex-1 max-w-sm bg-surface-container-high rounded-xl animate-pulse" />
        <div className="h-10 w-40 bg-surface-container-high rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    </div>
  );
}
