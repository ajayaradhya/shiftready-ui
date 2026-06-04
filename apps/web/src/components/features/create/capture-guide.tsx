"use client";

import { Sun, Move, Zap, DoorOpen, Smartphone } from "lucide-react";

const STEPS = [
  {
    icon: <Sun size={18} />,
    title: "High Contrast",
    desc: "Open blinds and turn on lights. AI detects brands best in natural daylight."
  },
  {
    icon: <Move size={18} />,
    title: "Cinematic Pace",
    desc: "Walk slowly. Sudden movements cause motion blur that hides serial numbers."
  },
  {
    icon: <Zap size={18} />,
    title: "The 3-Second Rule",
    desc: "Pause briefly on expensive assets like electronics or designer labels."
  },
  {
    icon: <DoorOpen size={18} />,
    title: "Full Access",
    desc: "Open wardrobes and cabinets if you want the internal items cataloged."
  }
];

export function CaptureGuide() {
  return (
    <div className="w-full max-w-4xl mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      <div className="flex items-center gap-4 mb-8 justify-center">
        <div className="h-[1px] w-12 bg-outline-variant/20" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-outline">
          Walkthrough Protocol
        </h2>
        <div className="h-[1px] w-12 bg-outline-variant/20" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {STEPS.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/10 group-hover:border-primary/40 transition-all duration-500 group-hover:scale-110">
              {step.icon}
            </div>
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-on-surface">
                {step.title}
              </h3>
              <p className="text-[11px] leading-relaxed text-on-surface-variant/60 font-medium">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center gap-3">
        <Smartphone size={14} className="text-primary" />
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
          Pro Tip: Capture in landscape mode for a wider field of view
        </p>
      </div>
    </div>
  );
}