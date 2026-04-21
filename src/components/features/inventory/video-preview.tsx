"use client";

import { Play, Maximize, Settings2, Globe, CheckCircle2 } from "lucide-react";

interface VideoPreviewProps {
  videoUrl?: string;
  status?: string;
  itemCount: number;
}

export function VideoPreview({ videoUrl, status, itemCount }: VideoPreviewProps) {
  const isLive = status === "live";
  const isProcessing = ["processing", "pricing_in_progress"].includes(status || "");

  return (
    <div className="w-full md:w-[55%] flex flex-col gap-6 relative z-10">
      <header className="animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-4xl md:text-[3.5rem] font-bold tracking-tight text-on-surface">
            {isLive ? "Public Listing" : "Inventory Scan"}
          </h2>
          {isLive && (
            <div className="flex items-center gap-1 px-3 py-1 bg-tertiary/10 text-tertiary rounded-full border border-tertiary/20">
              <CheckCircle2 size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
            </div>
          )}
        </div>
        <p className="text-on-surface-variant text-lg">
          {isLive 
            ? "Your inventory is currently live on the ShiftReady marketplace." 
            : "Reviewing auto-captured assets from residential walkthrough."}
        </p>
      </header>
      
      <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-container-low shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] group">
        <video 
          id="inventory-video"
          key={videoUrl} 
          controls={isLive}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${isProcessing ? 'opacity-40' : 'opacity-90'}`}>
          <source src={videoUrl} type="video/mp4" />
        </video>
        
        {!isLive && (
          <div className="absolute bottom-4 left-4 right-4 bg-surface-variant/60 backdrop-blur-[24px] border-t-[0.5px] border-primary/50 rounded-xl p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-4">
              <Play size={20} fill="currentColor" className="text-on-surface" />
              <span className="text-xs text-on-surface-variant tracking-wider font-medium font-mono">LIVE_FEED</span>
            </div>
            <div className="flex items-center gap-4 text-on-surface">
              <Settings2 size={18} />
              <Maximize size={18} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 mt-4">
        <div className="bg-surface-container-low rounded-xl p-6 border-b-2 border-primary/20 transition-all hover:bg-surface-container-high">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Items Scanned</span>
          <p className="text-3xl font-bold text-on-surface mt-1">{itemCount}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 border-b-2 border-tertiary/20 transition-all hover:bg-surface-container-high">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Market Status</span>
          <p className="text-sm font-bold text-tertiary mt-4 uppercase tracking-widest flex items-center gap-2">
            <Globe size={14} />
            {status?.replace('_', ' ')}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 transition-all hover:bg-surface-container-high">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Location</span>
          <p className="text-xl font-bold text-on-surface mt-2">Sydney, AU</p>
        </div>
      </div>
    </div>
  );
}