import React from 'react';
import { useWorldStore, PLACES } from '../world/state/useWorldStore';
import { t } from '../i18n';

// Mini compass / map listing all places for fast travel.

export const Compass: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const setCurrentPlace = useWorldStore((s) => s.setCurrentPlace);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const role = useWorldStore((s) => s.role);
  const playerPosition = useWorldStore((s) => s.playerPosition);

  return (
    <div className="bg-[#2A3168]/90 rounded-2xl border-2 border-[#F2B33D] p-2 max-h-[60vh] overflow-y-auto">
      <p className="text-white text-xs font-bold px-2 py-1">{t(language, 'places.map')}</p>
      {PLACES.map((place) => {
        const locked = place.staffOnly && role === 'beneficiary';
        const dx = place.position[0] - playerPosition[0];
        const dz = place.position[2] - playerPosition[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        return (
          <button
            key={place.id}
            onClick={() => {
              if (locked) return;
              setCurrentPlace(place.id);
              const panelId = place.id === 'fieldWorker' ? 'worker' : place.id === 'districtPlanner' ? 'planner' : place.id;
              setActivePanel(panelId as any);
            }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-bold transition-colors ${
              locked ? 'text-white/40' : 'text-white hover:bg-white/10'
            }`}
          >
            <span>{locked ? '🔒' : '📍'}</span>
            <span className="flex-1">{t(language, `places.${place.id}`)}</span>
            <span className="text-white/60 text-[10px]">{dist.toFixed(0)}m</span>
          </button>
        );
      })}
    </div>
  );
};
