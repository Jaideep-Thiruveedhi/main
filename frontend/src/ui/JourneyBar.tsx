import React from 'react';
import { useWorldStore } from '../world/state/useWorldStore';
import { t } from '../i18n';

const STAGES = ['profileMade', 'referral', 'enrolled', 'trainingComplete', 'job'];

export const JourneyBar: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const journeyStage = useWorldStore((s) => s.journeyStage);

  return (
    <div className="bg-[#2A3168]/90 rounded-2xl border-2 border-[#F2B33D] p-2">
      <p className="text-white text-[10px] font-bold px-1 pb-1">{t(language, 'journey.title')}</p>
      <div className="flex gap-1">
        {STAGES.map((stage, i) => {
          const done = i < journeyStage;
          const current = i === journeyStage;
          return (
            <div
              key={stage}
              className={`flex-1 h-2.5 rounded-full ${done ? 'bg-[#F2B33D]' : current ? 'bg-[#D9734E]' : 'bg-white/20'}`}
              title={t(language, `journey.${stage}`)}
            />
          );
        })}
      </div>
      {/* Only the current stage is labelled, so Devanagari/Tamil text never overlaps */}
      <p className="px-0.5 pt-1 text-[10px] font-bold text-white/90 truncate">
        {t(language, `journey.${STAGES[Math.min(journeyStage, STAGES.length - 1)]}`)}
      </p>
    </div>
  );
};
