import React from 'react';
import { useWorldStore, PLACES, PlaceId } from '../world/state/useWorldStore';
import { t } from '../i18n';
import { PlacePanel } from './PlacePanel';

// 2D accessible fallback ("सरल दृश्य") - large-button list of all places.
// Feature parity with the 3D world; the world is an enhancement, never a gate.

export const SimpleMode: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const activePanel = useWorldStore((s) => s.activePanel);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const role = useWorldStore((s) => s.role);
  const offlineMode = useWorldStore((s) => s.offlineMode);
  const sampleDataBadge = useWorldStore((s) => s.sampleDataBadge);

  return (
    <div className="min-h-screen bg-[#FBF1DE] p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-[#2A3168]">{t(language, 'app.title')}</h1>
          <span className="text-xs font-bold text-slate-500">{t(language, 'hud.simpleMode')}</span>
        </div>

        {(sampleDataBadge || offlineMode) && (
          <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold mb-4 border border-amber-300">
            {offlineMode ? t(language, 'app.offlineSample') : t(language, 'app.sampleData')}
          </div>
        )}

        <div className="space-y-3">
          {PLACES.map((place) => {
            const locked = place.staffOnly && role === 'beneficiary';
            const panelId = place.id === 'fieldWorker' ? 'worker' : place.id === 'districtPlanner' ? 'planner' : place.id;
            return (
              <button
                key={place.id}
                onClick={() => {
                  if (locked) return;
                  setActivePanel(panelId as any);
                }}
                disabled={locked}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  locked
                    ? 'border-slate-200 bg-slate-50 opacity-50'
                    : 'border-[#2A3168] bg-white hover:bg-amber-50 hover:border-[#F2B33D]'
                }`}
              >
                <span className="text-3xl">{locked ? '🔒' : '📍'}</span>
                <div className="flex-1">
                  <h2 className="font-bold text-slate-900 text-lg">{t(language, `places.${place.id}`)}</h2>
                  {locked && <p className="text-xs text-slate-500">{t(language, 'hud.locked')}</p>}
                </div>
                <span className="text-[#D9734E] font-bold">→</span>
              </button>
            );
          })}
        </div>

        {activePanel && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <PlacePanel panelId={activePanel} onClose={() => setActivePanel(null)} />
          </div>
        )}
      </div>
    </div>
  );
};
