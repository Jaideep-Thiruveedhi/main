import React from 'react';
import { useWorldStore, PLACES, PlaceId } from '../world/state/useWorldStore';
import { t } from '../i18n';
import { Hotbar } from './Hotbar';
import { Compass } from './Compass';
import { Subtitles } from './Subtitles';
import { JourneyBar } from './JourneyBar';
import { SettingsSheet } from './SettingsSheet';
import { PlacePanel } from './PlacePanel';
import { TouchControls, ProximityPrompt } from './TouchControls';

// Game-style HUD overlay. No sidebar, no nav bar - just game UI.

export const Hud: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const activePanel = useWorldStore((s) => s.activePanel);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const soundEnabled = useWorldStore((s) => s.soundEnabled);
  const setSoundEnabled = useWorldStore((s) => s.setSoundEnabled);
  const setLanguage = useWorldStore((s) => s.setLanguage);
  const role = useWorldStore((s) => s.role);
  const setRole = useWorldStore((s) => s.setRole);
  const sampleDataBadge = useWorldStore((s) => s.sampleDataBadge);
  const offlineMode = useWorldStore((s) => s.offlineMode);

  return (
    <div className="fixed inset-0 pointer-events-none" data-ui style={{ zIndex: 10 }}>
      {/* Top-left: logo + language + sound */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-auto">
        <div className="bg-[#2A3168] text-white px-3 py-1.5 rounded-xl font-bold text-sm border-2 border-[#F2B33D]">
          {t(language, 'app.title')}
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          className="bg-white/90 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
          aria-label={t(language, 'hud.language')}
        >
          <option value="hi">हिं</option>
          <option value="en">EN</option>
          <option value="ta">த</option>
          <option value="bn">বাং</option>
          <option value="te">తె</option>
        </select>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-9 h-9 rounded-lg bg-white/90 border border-slate-300 flex items-center justify-center text-base"
          aria-label={t(language, 'hud.sound')}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button
          onClick={() => setActivePanel('settings')}
          className="w-9 h-9 rounded-lg bg-white/90 border border-slate-300 flex items-center justify-center text-base"
          aria-label={t(language, 'hud.settings')}
        >
          ⚙️
        </button>
        {/* Role switcher (demo) */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="bg-white/90 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
          aria-label="Role"
        >
          <option value="beneficiary">Beneficiary</option>
          <option value="field_worker">Field Worker</option>
          <option value="district_officer">District Officer</option>
        </select>
      </div>

      {/* Sample data badge */}
      {(sampleDataBadge || offlineMode) && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-300">
          {offlineMode ? t(language, 'app.offlineSample') : t(language, 'app.sampleData')}
        </div>
      )}

      {/* Top-right: compass */}
      <div className="absolute top-3 right-3 pointer-events-auto">
        <Compass />
      </div>

      {/* Bottom-left: journey progress */}
      <div className="absolute bottom-24 left-3 pointer-events-auto">
        <JourneyBar />
      </div>

      {/* Bottom-centre: hotbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto">
        <Hotbar />
      </div>

      {/* Mobile controls + desktop proximity prompt */}
      <TouchControls />
      <ProximityPrompt />

      {/* Subtitles */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <Subtitles />
      </div>

      {/* Active panel. 'settings' has its own sheet; 'map' reuses the compass. */}
      {activePanel === 'settings' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/20">
          <SettingsSheet onClose={() => setActivePanel(null)} />
        </div>
      )}
      {activePanel && activePanel !== 'settings' && activePanel !== 'map' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/20">
          <PlacePanel panelId={activePanel} onClose={() => setActivePanel(null)} />
        </div>
      )}
    </div>
  );
};
