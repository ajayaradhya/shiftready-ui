'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProfileImageProps {
  src: string | null | undefined;
  name: string;
}

export default function ProfileImage({ src, name }: ProfileImageProps) {
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);

  // Path to a local placeholder image in your /public folder
  // Ensure you have an image at public/default-avatar.png
  const PLACEHOLDER_IMAGE = '/default-avatar.png';

  useEffect(() => {
    // Only run in browser and if src exists
    if (typeof window === 'undefined' || !src || src.startsWith('data:')) return;

    // Generate a simple unique key for this image URL
    const cacheKey = `user_avatar_${btoa(src).substring(0, 32)}`;
    const storedImage = localStorage.getItem(cacheKey);

    if (storedImage) {
      setCachedSrc(storedImage);
    } else {
      // Fetch the image once and convert to Base64 to avoid future network calls
      const fetchAndCacheImage = async () => {
        try {
          const response = await fetch(src);
          if (!response.ok) throw new Error('Failed to fetch');

          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            try {
              localStorage.setItem(cacheKey, base64data);
              setCachedSrc(base64data);
            } catch {
              // Handle localStorage quota limits gracefully
              console.warn('LocalStorage quota exceeded, skipping cache');
            }
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('Profile image caching failed:', error);
          // Fallback to direct URL if caching fails (likely CORS or 429)
        }
      };

      fetchAndCacheImage();
    }
  }, [src]);

  // Fallback to initials if we have no source or if even the placeholder image fails to load
  if (placeholderFailed || (!src && !cachedSrc)) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200">
      <Image
        src={hasError ? PLACEHOLDER_IMAGE : (cachedSrc || src!)}
        alt={name}
        fill
        className="object-cover"
        onError={() => {
          if (!hasError) {
            setHasError(true);
          } else {
            setPlaceholderFailed(true);
          }
        }}
        unoptimized // Prevents Next.js server from being rate-limited by Google
      />
    </div>
  );
}