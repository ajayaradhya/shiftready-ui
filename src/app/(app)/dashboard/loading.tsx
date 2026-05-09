export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="h-8 w-48 bg-surface-container-high rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-surface-container rounded animate-pulse mb-10" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    </div>
  );
}
