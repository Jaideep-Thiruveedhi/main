import React from 'react';
import { t } from '../i18n';
import { useWorldStore } from '../world/state/useWorldStore';

// Interest vs Verified match card. Never colour-only: icon + text + pattern.

export interface MatchCardProps {
  title: string;
  verified: boolean;
  distanceKm: number;
  seats?: number;
  stipend?: string;
  nsqfLevel?: number;
  reason?: string;
  onApply?: () => void;
  onVerify?: () => void;
  isWorker?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  title, verified, distanceKm, seats, stipend, nsqfLevel, reason, onApply, onVerify, isWorker,
}) => {
  const language = useWorldStore((s) => s.language);

  return (
    <div
      className={`rounded-xl p-4 border-2 ${
        verified
          ? 'border-[#F2B33D] bg-amber-50'
          : 'border-dashed border-blue-400 bg-blue-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{verified ? '🏠' : '📐'}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              verified ? 'bg-[#F2B33D] text-[#2A3168]' : 'bg-blue-200 text-blue-800'
            }`}>
              {verified ? t(language, 'match.verified') : t(language, 'match.interest')}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {verified ? t(language, 'match.verifiedHint') : t(language, 'match.interestHint')}
          </p>
          <div className="flex gap-3 mt-2 text-xs font-bold text-slate-500">
            <span>📍 {distanceKm} {t(language, 'match.km')}</span>
            {seats !== undefined && <span>💺 {seats} {t(language, 'match.seats')}</span>}
            {stipend && <span>💰 {stipend}</span>}
            {nsqfLevel && <span>📊 L{nsqfLevel}</span>}
          </div>
          {reason && <p className="text-xs text-slate-500 mt-2 italic">{reason}</p>}
        </div>
      </div>
      {/* Action area */}
      <div className="mt-3 flex gap-2">
        {verified && onApply && (
          <button
            onClick={onApply}
            className="flex-1 bg-[#D9734E] hover:bg-[#c1633a] text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
          >
            {t(language, 'match.apply')}
          </button>
        )}
        {!verified && isWorker && onVerify && (
          <button
            onClick={onVerify}
            className="flex-1 bg-[#2A3168] hover:bg-[#1e2450] text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
          >
            {t(language, 'worker.verify')}
          </button>
        )}
        {!verified && !isWorker && (
          <p className="text-xs text-blue-700 font-bold flex items-center gap-1">
            📐 {t(language, 'match.interestHint')}
          </p>
        )}
      </div>
    </div>
  );
};
