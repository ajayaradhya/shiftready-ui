"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileVideo, CheckCircle2, Loader2 } from "lucide-react";
import { initSale, startProcessing } from "@/lib/api";

export function VideoUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "finalizing">("idle");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");

    try {
      // 1. Initialize Sale in Firestore & get Signed URL
      const { event_id, upload_url } = await initSale("ajay_web_test", file.name);

      // 2. Upload directly to GCS using the Signed URL
      // We use XHR here instead of fetch to track progress accurately
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", file.type);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => (xhr.status === 200 ? resolve(xhr.response) : reject());
        xhr.onerror = () => reject();
        xhr.send(file);
      });

      await uploadPromise;

      // 3. Trigger Gemini AI Pipeline
      setStatus("finalizing");
      await startProcessing(event_id);

      // 4. Redirect to the Inventory page
      // The Inventory page's useInventory hook will pick up the 'processing' status
      router.push(`/inventory/${event_id}`);

    } catch (error) {
      console.error("Upload failed:", error);
      setStatus("idle");
      alert("Upload failed. Check backend/CORS settings.");
    }
  };

  return (
    <div className="w-full max-w-2xl bg-surface-container-low rounded-3xl p-12 border border-outline-variant/10 shadow-2xl">
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center gap-6 ${
          file ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/20 hover:border-primary/20'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="video/*" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {status === "idle" ? (
          <>
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center text-primary shadow-inner">
              {file ? <FileVideo size={32} /> : <Upload size={32} />}
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-on-surface mb-2">
                {file ? file.name : "Select your walkthrough video"}
              </h3>
              <p className="text-on-surface-variant text-sm">
                MP4 or MOV, up to 500MB recommended.
              </p>
            </div>

            <button 
              onClick={() => file ? handleUpload() : fileInputRef.current?.click()}
              className="px-8 py-4 bg-primary text-surface rounded-full font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all"
            >
              {file ? "Begin AI Analysis" : "Choose File"}
            </button>
          </>
        ) : (
          <div className="w-full space-y-8 py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-primary/10 rounded-full" />
                <div 
                  className="absolute inset-0 border-4 border-primary rounded-full transition-all duration-300"
                  style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-primary">
                  {progress}%
                </div>
              </div>
              <p className="text-on-surface font-bold uppercase tracking-widest text-xs">
                {status === "uploading" ? "Syncing with GCS..." : "Handing off to Gemini..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}