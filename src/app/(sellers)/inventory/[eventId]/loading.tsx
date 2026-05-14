export default function InventoryLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full p-8 gap-12 animate-pulse">
      <div className="w-80 shrink-0 flex flex-col gap-4">
        <div className="aspect-video w-full bg-surface-container-high rounded-2xl" />
        <div className="h-4 w-32 bg-surface-container-high rounded" />
        <div className="h-3 w-24 bg-surface-container-high rounded" />
      </div>

      <section className="flex-1 flex flex-col gap-16">
        {[0, 1].map((bundle) => (
          <div key={bundle} className="flex flex-col gap-6">
            <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2">
              <div className="h-5 w-32 bg-surface-container-high rounded" />
              <div className="h-3 w-20 bg-surface-container-high rounded" />
            </div>
            <div className="grid gap-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-24 w-full bg-surface-container-high rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
