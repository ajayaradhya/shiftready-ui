"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const CONSENT_KEY = "sr_cookie_consent";

export function GaScript({ gaId }: { gaId: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "true") setConsented(true);

    const handler = () => {
      if (localStorage.getItem(CONSENT_KEY) === "true") setConsented(true);
    };
    window.addEventListener("sr:consent", handler);
    return () => window.removeEventListener("sr:consent", handler);
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false});`}
      </Script>
    </>
  );
}
