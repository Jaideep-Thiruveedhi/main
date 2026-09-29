import React, { useEffect, useRef, useState } from 'react';
import { useWorldStore, PLACES, type PlaceId } from '../world/state/useWorldStore';
import { t } from '../i18n';

// Mobile controls: left virtual joystick, big round Interact and Mic buttons.
// All targets are >= 56px. Marked data-ui so the camera ignores touches here.

const Joystick: React.FC = () => {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  const setJoystick = (v: { x: number; y: number } | null) => {
    (window as any).__setJoystick?.(v);
  };

  const onStart = (e: React.PointerEvent) => {
    active.current = e.pointerId;
    origin.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (active.current !== e.pointerId) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    const max = 46;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, max);
    const nx = (dx / len) * (clamped / max);
    const ny = (dy / len) * (clamped / max);
    setKnob({ x: dx / len * clamped, y: dy / len * clamped });
    setJoystick({ x: nx, y: ny });
  };
  const onEnd = (e: React.PointerEvent) => {
    if (active.current !== e.pointerId) return;
    active.current = null;
    setKnob({ x: 0, y: 0 });
    setJoystick(null);
  };

  return (
    <div
      data-ui
      onPointerDown={onStart}
      onPointerMove={onMove}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      className="w-32 h-32 rounded-full bg-black/30 border-2 border-white/40 flex items-center justify-center touch-none"
      aria-label="Movement joystick"
    >
      <div
        className="w-14 h-14 rounded-full bg-white/80 border-2 border-white"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
};

const MicButton: React.FC = () => {
  const mitraState = useWorldStore((s) => s.mitraState);
  const setMitraState = useWorldStore((s) => s.setMitraState);
  const setMitraCaption = useWorldStore((s) => s.setMitraCaption);
  const language = useWorldStore((s) => s.language);
  const [supported] = useState(
    () => typeof window !== 'undefined' && !!(window as any).webkitSpeechRecognition
  );

  const colour =
    mitraState === 'listening' ? 'bg-[#5a9aec]'
      : mitraState === 'thinking' ? 'bg-[#c17ae8]'
      : mitraState === 'speaking' ? 'bg-[#7ae88a]'
      : 'bg-[#2A3168]';

  const onPress = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMitraState('listening');
      setMitraCaption(supported ? t(language, 'mitra.listening') : 'Speech input is not available in this browser. The village still works.');
      setTimeout(() => setMitraState('idle'), 2000);
      return;
    }
    const rec = new SR();
    rec.lang = language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : language;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setMitraState('listening');
    setMitraCaption(t(language, 'mitra.listening'));
    rec.onresult = (e: any) => {
      const said = e.results?.[0]?.[0]?.transcript;
      setMitraState('thinking');
      setTimeout(() => {
        setMitraState('speaking');
        setMitraCaption(said || t(language, 'mitra.idle'));
        setTimeout(() => setMitraState('idle'), 2500);
      }, 900);
    };
    rec.onerror = () => {
      setMitraState('idle');
      setMitraCaption(t(language, 'mitra.idle'));
    };
    rec.onend = () => { if (mitraState === 'listening') setMitraState('idle'); };
    try { rec.start(); } catch { setMitraState('idle'); }
  };

  return (
    <button
      data-ui
      onClick={onPress}
      className={`w-16 h-16 rounded-full ${colour} text-white font-bold text-xs flex flex-col items-center justify-center shadow-lg border-2 border-white/70`}
      aria-label={t(language, 'hud.mic')}
    >
      <span className="text-xl">🎤</span>
      <span className="mt-0.5">{t(language, 'hud.mic')}</span>
    </button>
  );
};

const InteractButton: React.FC = () => {
  const nearbyPlace = useWorldStore((s) => s.nearbyPlace);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const setCurrentPlace = useWorldStore((s) => s.setCurrentPlace);
  const language = useWorldStore((s) => s.language);

  const onPress = () => {
    if (!nearbyPlace) return;
    setCurrentPlace(nearbyPlace);
    setActivePanel(
      (nearbyPlace === 'fieldWorker' ? 'worker'
        : nearbyPlace === 'districtPlanner' ? 'planner'
        : nearbyPlace) as any
    );
  };

  const label = nearbyPlace ? t(language, `places.${nearbyPlace}`) : t(language, 'hud.interact');

  return (
    <button
      data-ui
      onClick={onPress}
      disabled={!nearbyPlace}
      className="h-16 px-5 rounded-full bg-[#F2B33D] text-[#2A3168] font-black text-sm flex items-center gap-2 shadow-lg border-2 border-white disabled:opacity-40"
      aria-label={t(language, 'hud.interact')}
    >
      <span className="text-xl">✋</span>
      <span className="max-w-[110px] truncate text-left">{label}</span>
    </button>
  );
};

export const TouchControls: React.FC = () => {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const check = () => setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener('touchstart', check, { once: true });
    return () => window.removeEventListener('touchstart', check);
  }, []);

  if (!isTouch) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20" data-ui>
      <div className="absolute left-4 bottom-4 pointer-events-auto">
        <Joystick />
      </div>
      <div className="absolute right-4 bottom-4 flex flex-col items-end gap-3 pointer-events-auto">
        <MicButton />
        <InteractButton />
      </div>
    </div>
  );
};

// Desktop proximity prompt ("Press E")
export const ProximityPrompt: React.FC = () => {
  const nearbyPlace = useWorldStore((s) => s.nearbyPlace);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const setCurrentPlace = useWorldStore((s) => s.setCurrentPlace);
  const language = useWorldStore((s) => s.language);
  const role = useWorldStore((s) => s.role);

  if (!nearbyPlace) return null;
  const place = PLACES.find((p) => p.id === nearbyPlace);
  if (place?.staffOnly && role === 'beneficiary') return null;

  const label = t(language, `places.${nearbyPlace}`);

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-44 pointer-events-auto" data-ui>
      <button
        onClick={() => {
          setCurrentPlace(nearbyPlace);
          setActivePanel(
            (nearbyPlace === 'fieldWorker' ? 'worker'
              : nearbyPlace === 'districtPlanner' ? 'planner'
              : nearbyPlace) as any
          );
        }}
        className="flex items-center gap-2 bg-black/70 text-white px-4 py-2 rounded-xl font-bold text-sm border-2 border-[#F2B33D]"
      >
        <kbd className="px-2 py-0.5 rounded bg-white/20 text-xs font-black">{t(language, 'hud.pressE')}</kbd>
        <span>{label}</span>
      </button>
    </div>
  );
};
