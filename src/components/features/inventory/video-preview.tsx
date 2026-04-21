export function VideoPreview({ videoUrl, status, itemCount }: { 
  videoUrl?: string; 
  status?: string;
  itemCount: number;
}) {
  return (
    <div className="w-full md:w-[55%] flex flex-col gap-6 relative z-10">
      <header>
        <h2 className="text-4xl font-bold tracking-tight text-on-surface mb-2">
          {status === 'ready_for_review' ? 'Scan Complete' : 'AI Analysis in Progress'}
        </h2>
        <p className="text-on-surface-variant">
          {status === 'ready_for_review' 
            ? 'Review and verify the detected items and suggested pricing.' 
            : 'Gemini is currently identifying brands and pricing trends...'}
        </p>
      </header>
      
      <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-container-low shadow-2xl">
        <video 
          key={videoUrl} // Key forces video to reload when URL changes
          controls 
          className="w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-4">
        <div className="bg-surface-container-low rounded-xl p-6 border-b-2 border-primary/20">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Items</span>
          <p className="text-3xl font-bold text-on-surface mt-1">{itemCount}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Status</span>
          <p className="text-sm font-bold text-primary mt-3 uppercase tracking-tighter">
            {status?.replace('_', ' ')}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Location</span>
          <p className="text-xl font-bold text-on-surface mt-2">Sydney, AU</p>
        </div>
      </div>
    </div>
  );
}