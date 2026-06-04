"use client";

import { useUpload } from "@/hooks/use-upload";
import { UploadScreen } from "@/components/features/create/upload-screen";
import { ProcessingScreen } from "@/components/features/create/processing-screen";

export default function SellerCentralCreatePage() {
  const { status, uploadProgress, fileError, eventId, uploadedFile, uploadFile } = useUpload();

  if (status === "processing" && eventId) {
    return <ProcessingScreen eventId={eventId} uploadedFile={uploadedFile} />;
  }

  return (
    <UploadScreen
      status={status}
      uploadProgress={uploadProgress}
      fileError={fileError}
      uploadFile={uploadFile}
    />
  );
}
