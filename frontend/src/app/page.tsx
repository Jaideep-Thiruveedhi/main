"use client";
import dynamic from 'next/dynamic';
import { useWorldStore } from '../world/state/useWorldStore';
import { SimpleMode } from '../ui/SimpleMode';

// The world is client-only (WebGL). Falls back to 2D SimpleMode when chosen.

const World = dynamic(() => import('../world/World').then((m) => m.World), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#2A3168] flex items-center justify-center text-white">
      <div className="text-center">
        <div className="text-4xl mb-4">🏘️</div>
        <p className="text-sm text-white/70">Loading...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  const simpleMode = useWorldStore((s) => s.simpleMode);

  if (simpleMode) {
    return <SimpleMode />;
  }

  return <World />;
}
