"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initSale, startProcessing } from "@/lib/api";
import { Upload, Sparkles, Video, Loader2 } from "lucide-react";

export default function CreateSalePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "processing">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus("uploading");

      // 1. Handshake with Monolith Backend
      const { event_id, upload_url } = await initSale("ajay_web_test", file.name);

      // 2. Upload to GCS
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 95 ? 95 : prev + 2));
      }, 150);

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      clearInterval(uploadInterval);
      if (!uploadRes.ok) throw new Error("GCS Upload failed");
      setUploadProgress(100);

      // 3. Trigger Stage 1 AI (Extraction)
      setStatus("processing");
      await startProcessing(event_id);

      // 4. Smooth transition to the Inventory Cockpit
      setTimeout(() => {
        router.push(`/inventory/${event_id}`);
      }, 1500);

    } catch (err) {
      console.error("Relocation Regressed:", err);
      setStatus("idle");
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] bg-surface">
      <div className="w-full max-w-xl bg-surface-container-high rounded-[2rem] p-12 border border-outline-variant/10 shadow-2xl flex flex-col items-center gap-8 text-center animate-in fade-in zoom-in duration-500">
        
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
          {status === "processing" ? <Sparkles className="animate-pulse" size={40} /> : <Video size={40} />}
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-on-surface uppercase tracking-tighter">
            {status === "idle" ? "Start Your Move" : status === "uploading" ? "Syncing Bytes" : "AI Extraction"}
          </h1>
          <p className="text-sm text-on-surface-variant font-medium italic leading-relaxed px-4">
            {status === "idle" 
              ? "Upload your residential walkthrough. Gemini will identify assets and benchmark Sydney market prices." 
              : "Connecting to the ShiftReady cloud monolith. Gemini is preparing to scan your inventory."}
          </p>
        </div>

        {status === "idle" ? (
          <label className="group relative cursor-pointer mt-4">
            <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
            <div className="flex items-center gap-3 bg-primary text-surface px-10 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30">
              <Upload size={20} />
              Select Walkthrough
            </div>
          </label>
        ) : (
          <div className="w-full mt-4 space-y-6">
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <Loader2 className="animate-spin" size={14} />
              {status}... {uploadProgress}%
            </div>
          </div>
        )}

        {/* Relocation Timeline Tracker */}
        <div className="mt-12 flex items-center gap-4 opacity-20">
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">1</div>
            <span className="text-[7px] font-black uppercase tracking-widest">Record</span>
          </div>
          <div className="w-8 h-px bg-current" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">2</div>
            <span className="text-[7px] font-black uppercase tracking-widest">Upload</span>
          </div>
          <div className="w-8 h-px bg-current" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">3</div>
            <span className="text-[7px] font-black uppercase tracking-widest">Sell</span>
          </div>
        </div>
      </div>
    </div>
  );
}