import React from 'react';
import { useWorldStore } from '../world/state/useWorldStore';
import { t } from '../i18n';
import type { QualityTier } from '../world/engine/quality';

export const SettingsSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const language = useWorldStore((s) => s.language);
  const quality = useWorldStore((s) => s.quality);
  const setQuality = useWorldStore((s) => s.setQuality);
  const reduceMotion = useWorldStore((s) => s.reduceMotion);
  const setReduceMotion = useWorldStore((s) => s.setReduceMotion);
  const highContrast = useWorldStore((s) => s.highContrast);
  const setHighContrast = useWorldStore((s) => s.setHighContrast);
  const captionsEnabled = useWorldStore((s) => s.captionsEnabled);
  const setCaptionsEnabled = useWorldStore((s) => s.setCaptionsEnabled);
  const textSize = useWorldStore((s) => s.textSize);
  const setTextSize = useWorldStore((s) => s.setTextSize);
  const simpleMode = useWorldStore((s) => s.simpleMode);
  const setSimpleMode = useWorldStore((s) => s.setSimpleMode);

  return (
    <div className="w-full max-w-sm mx-4">
      <div className="bg-[#FBF1DE] rounded-2xl border-4 border-[#2A3168] shadow-2xl overflow-hidden">
        <div className="bg-[#2A3168] px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{t(language, 'settings.title')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center" aria-label={t(language, 'hud.close')}>✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Quality */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1">{t(language, 'hud.quality')}</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as QualityTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setQuality(tier)}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                    quality === tier ? 'bg-[#2A3168] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t(language, `settings.quality${tier.charAt(0).toUpperCase() + tier.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Text size */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1">{t(language, 'hud.textSize')}</label>
            <div className="flex gap-2">
              {(['s', 'm', 'l', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setTextSize(size)}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                    textSize === size ? 'bg-[#2A3168] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <Toggle label={t(language, 'hud.reduceMotion')} value={reduceMotion} onChange={setReduceMotion} />
            <Toggle label={t(language, 'hud.highContrast')} value={highContrast} onChange={setHighContrast} />
            <Toggle label={t(language, 'hud.captions')} value={captionsEnabled} onChange={setCaptionsEnabled} />
            <Toggle label={t(language, 'hud.simpleMode')} value={simpleMode} onChange={setSimpleMode} />
          </div>
        </div>
        <div className="px-4 py-3 border-t-2 border-[#2A3168]/10">
          <button onClick={onClose} className="w-full bg-[#D9734E] hover:bg-[#c1633a] text-white font-bold text-sm py-2.5 rounded-xl transition-colors">
            ← {t(language, 'hud.backToVillage')}
          </button>
        </div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className="w-full flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2.5"
    role="switch"
    aria-checked={value}
  >
    <span className="text-sm font-bold text-slate-700">{label}</span>
    <span className={`w-10 h-6 rounded-full transition-colors ${value ? 'bg-[#2A3168]' : 'bg-slate-300'}`}>
      <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </span>
  </button>
);
