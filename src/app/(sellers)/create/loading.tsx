export default function CreateLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh]">
      <div className="w-full max-w-xl bg-surface-container-high rounded-[2rem] p-12 border border-outline-variant/10 shadow-2xl flex flex-col items-center gap-8 animate-pulse">
        {/* Icon skeleton */}
        <div className="w-20 h-20 bg-surface-container-highest rounded-3xl" />

        {/* Text skeletons */}
        <div className="space-y-3 w-full flex flex-col items-center">
          <div className="h-9 w-48 bg-surface-container-highest rounded-lg" />
          <div className="h-4 w-64 bg-surface-container-highest rounded" />
          <div className="h-4 w-48 bg-surface-container-highest rounded" />
        </div>

        {/* Button skeleton */}
        <div className="h-14 w-52 bg-surface-container-highest rounded-full mt-4" />
      </div>
    </div>
  );
}
