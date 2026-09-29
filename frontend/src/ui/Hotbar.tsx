import React from 'react';
import { useWorldStore, PLACES, type PlaceId } from '../world/state/useWorldStore';
import { t } from '../i18n';
import { getWorldBlock } from '../world/engine/world';
import { CHUNK_HEIGHT } from '../world/engine/chunks';

const HOTBAR_PLACES: (PlaceId | 'map')[] = [
  'home', 'journey', 'training', 'jobs', 'careers', 'aid', 'community', 'assistant', 'map',
];

const PLACE_ICONS: Record<string, string> = {
  home: '🏠', journey: '🛤️', training: '🎓', jobs: '💼', careers: '📈',
  aid: '🏦', community: '👥', assistant: '🪔', map: '🗺️',
};

/** Topmost solid block Y at a world column, so fast travel lands on the ground. */
function surfaceY(x: number, z: number): number {
  for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
    const id = getWorldBlock(x, y, z);
    if (id !== 0 && id !== 12 && id !== 13 && id !== 14 && id !== 15 &&
        id !== 16 && id !== 17 && id !== 18 && id !== 19 && id !== 21 && id !== 24) {
      return y + 1;
    }
  }
  return 6;
}

export const Hotbar: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const currentPlace = useWorldStore((s) => s.currentPlace);
  const setCurrentPlace = useWorldStore((s) => s.setCurrentPlace);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const setAutoWalkTarget = useWorldStore((s) => s.setAutoWalkTarget);
  const role = useWorldStore((s) => s.role);

  return (
    <div className="flex gap-1.5 bg-[#2A3168]/90 p-2 rounded-2xl border-2 border-[#F2B33D]">
      {HOTBAR_PLACES.map((placeId) => {
        const place = PLACES.find((p) => p.id === placeId);
        const locked = place ? place.staffOnly && role === 'beneficiary' : false;
        const active = place ? currentPlace === placeId : false;
        return (
          <button
            key={placeId}
            onClick={() => {
              if (locked) return;
              if (placeId === 'map') {
                setActivePanel('map');
                return;
              }
              // Tap = go there (auto-walk). The panel opens on arrival.
              setCurrentPlace(placeId);
              setActivePanel(null);
              setAutoWalkTarget([
                place!.position[0],
                surfaceY(place!.position[0], place!.position[2]),
                place!.position[2],
              ]);
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
