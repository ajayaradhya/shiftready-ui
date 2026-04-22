"use client";

import { VideoUploader } from "@/components/features/create/video-uploader";
import { Header } from "@/components/ui/header";
import { Sparkles } from "lucide-react";

export default function CreateSalePage() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-8">
      <Header isProcessing={false}>
        <div className="flex items-center gap-2 ml-6 border-l border-outline-variant/20 pl-6">
          <Sparkles size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-outline">
            New Walkthrough
          </span>
        </div>
      </Header>

      <div className="w-full flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-1000">
        <header className="text-center space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-on-surface">
            Initialize <span className="text-primary italic">Shift</span>Ready
          </h1>
          <p className="text-on-surface-variant max-w-lg text-lg leading-relaxed">
            Upload your home walkthrough video. Gemini will extract inventory, 
            detect brands, and suggest Sydney market pricing in real-time.
          </p>
        </header>

        <VideoUploader />
        
        <footer className="text-[10px] text-outline uppercase tracking-[0.4em] font-bold">
          Encrypted Monolith Connection | GCS Secure Upload
        </footer>
      </div>
    </div>
  );
}