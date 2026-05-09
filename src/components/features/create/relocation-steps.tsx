const STEPS = ["Record", "Upload", "Sell"] as const;

export function RelocationSteps() {
  return (
    <div className="mt-12 flex items-center gap-4 opacity-20">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">
              {i + 1}
            </div>
            <span className="text-[7px] font-black uppercase tracking-widest">{step}</span>
          </div>
          {i < STEPS.length - 1 && <div className="w-8 h-px bg-current" />}
        </div>
      ))}
    </div>
  );
}
