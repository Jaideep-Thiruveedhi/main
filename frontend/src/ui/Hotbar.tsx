import React from 'react';
import { useWorldStore, PLACES, PlaceId } from '../world/state/useWorldStore';
import { t } from '../i18n';

const HOTBAR_PLACES: (PlaceId | 'map')[] = ['home', 'journey', 'training', 'jobs', 'careers', 'aid', 'community', 'assistant', 'map'];

const PLACE_ICONS: Record<string, string> = {
  home: '🏠', journey: '🛤️', training: '🎓', jobs: '💼', careers: '📈',
  aid: '🏦', community: '👥', assistant: '🪔', map: '🗺️',
};

export const Hotbar: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const currentPlace = useWorldStore((s) => s.currentPlace);
  const setCurrentPlace = useWorldStore((s) => s.setCurrentPlace);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const role = useWorldStore((s) => s.role);

  return (
    <div className="flex gap-1.5 bg-[#2A3168]/90 p-2 rounded-2xl border-2 border-[#F2B33D]">
      {HOTBAR_PLACES.map((placeId) => {
        const place = PLACES.find((p) => p.id === placeId);
        const locked = place ? place.staffOnly && role === 'beneficiary' : false;
        const active = place ? currentPlace === placeId : false;
        const panelId = placeId === 'map' ? 'map' : placeId === 'fieldWorker' ? 'worker' : placeId === 'districtPlanner' ? 'planner' : placeId;
        return (
          <button
            key={placeId}
            onClick={() => {
              if (locked) return;
              if (placeId !== 'map') setCurrentPlace(placeId);
              if (placeId === 'map') {
                setActivePanel('map');
              } else {
                setActivePanel(panelId as any);
              }
            }}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all min-w-[56px] ${
              active ? 'bg-[#F2B33D] text-[#2A3168]' : 'bg-white/10 text-white hover:bg-white/20'
            } ${locked ? 'opacity-40' : ''}`}
            aria-label={t(language, `places.${placeId}`)}
          >
            <span className="text-xl">{locked ? '🔒' : PLACE_ICONS[placeId]}</span>
            <span className="text-[10px] font-bold leading-tight">{t(language, `places.${placeId}`)}</span>
          </button>
        );
      })}
    </div>
  );
};
