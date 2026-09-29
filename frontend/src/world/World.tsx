import React, { useEffect, useState } from 'react';
import { WorldScene } from './scene/WorldScene';
import { Hud } from '../ui/Hud';
import { useWorldStore } from './state/useWorldStore';
import { t } from '../i18n';
import { detectQualityTier } from './engine/quality';

// Wraps the 3D canvas + HUD. Handles deep links and quality auto-detection.

export const World: React.FC = () => {
  const [ready, setReady] = useState(false);
  const language = useWorldStore((s) => s.language);
  const setQuality = useWorldStore((s) => s.setQuality);
  const setCurrentPlace = useWorldStore((s) => s.setCurrentPlace);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const setMitraCaption = useWorldStore((s) => s.setMitraCaption);
  const setFirstVisitDone = useWorldStore((s) => s.setFirstVisitDone);
  const firstVisitDone = useWorldStore((s) => s.firstVisitDone);

  useEffect(() => {
    // Auto-detect quality tier
    const tier = detectQualityTier();
    setQuality(tier);

    // Handle deep link ?place=xxx
    const params = new URLSearchParams(window.location.search);
    const place = params.get('place') as any;
    if (place) {
      setCurrentPlace(place);
      const panelId = place === 'fieldWorker' ? 'worker' : place === 'districtPlanner' ? 'planner' : place;
      setActivePanel(panelId);
    }

    // First visit greeting
    if (!firstVisitDone) {
      setTimeout(() => {
        setMitraCaption(t(language, 'mitra.greeting'));
        setFirstVisitDone(true);
      }, 1500);
    }

    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#2A3168] flex flex-col items-center justify-center text-white">
        <div className="text-4xl mb-4">🏘️</div>
        <h1 className="text-2xl font-black mb-2">{t(language, 'app.title')}</h1>
        <p className="text-sm text-white/70 mb-6">{t(language, 'app.loading')}</p>
        <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-[#F2B33D] rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
        <p className="text-xs text-white/50 mt-4">{t(language, 'app.loadingTip')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <SceneMount />
      <Hud />
    </div>
  );
};

// The R3F <Canvas> creates its own React root. Rendering it inside the same
// pass that flips `ready` makes that root unmount mid-render. Deferring the
// swap to a second effect (a separate commit) keeps the console clean.
const SceneMount: React.FC = () => {
  const [mount, setMount] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMount(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!mount) return null;
  return <WorldScene />;
};
