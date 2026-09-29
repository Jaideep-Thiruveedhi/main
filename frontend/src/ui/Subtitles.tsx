import React from 'react';
import { useWorldStore } from '../world/state/useWorldStore';
import { t } from '../i18n';

// Subtitle bar for Mitra's captions - always on, size adjustable.

export const Subtitles: React.FC = () => {
  const subtitle = useWorldStore((s) => s.subtitle);
  const mitraCaption = useWorldStore((s) => s.mitraCaption);
  const captionsEnabled = useWorldStore((s) => s.captionsEnabled);
  const textSize = useWorldStore((s) => s.textSize);
  const language = useWorldStore((s) => s.language);

  if (!captionsEnabled) return null;

  const sizeClass = { s: 'text-xs', m: 'text-sm', l: 'text-base', xl: 'text-lg' }[textSize];
  const text = mitraCaption || subtitle;

  if (!text) return null;

  return (
    <div
      className={`${sizeClass} bg-black/70 text-white px-4 py-2 rounded-xl text-center font-medium`}
      role="status"
      aria-live="polite"
    >
      {text}
    </div>
  );
};
