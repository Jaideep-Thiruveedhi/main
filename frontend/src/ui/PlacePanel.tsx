import React, { useState } from 'react';
import { useWorldStore } from '../world/state/useWorldStore';
import { t } from '../i18n';
import { MatchCard } from './MatchCard';
import { adaptRecommendations, adaptJobs, adaptFinancialAid, adaptCareers, adaptMentors, adaptDistrictCells } from '../world/adapters';
import { api } from '../lib/api';

// In-world panel styled like a Minecraft GUI / wooden sign / written book.

export const PlacePanel: React.FC<{ panelId: string; onClose: () => void }> = ({ panelId, onClose }) => {
  const language = useWorldStore((s) => s.language);
  const role = useWorldStore((s) => s.role);
  const [verifyState, setVerifyState] = useState<Record<string, 'idle' | 'building' | 'done'>>({});

  const isWorker = role === 'field_worker';

  const handleVerify = async (centreId: string) => {
    setVerifyState((s) => ({ ...s, [centreId]: 'building' }));
    try {
      // In a real deployment this calls the worker verify API
      await new Promise((r) => setTimeout(r, 1500));
      setVerifyState((s) => ({ ...s, [centreId]: 'done' }));
    } catch {
      setVerifyState((s) => ({ ...s, [centreId]: 'idle' }));
    }
  };

  const renderContent = () => {
    switch (panelId) {
      case 'training': {
        const centres = adaptRecommendations();
        return (
          <div className="space-y-3">
            {centres.map((c) => (
              <MatchCard
                key={c.id}
                title={c.title}
                verified={c.verified}
                distanceKm={c.distanceKm}
                seats={c.seats}
                stipend={c.stipend}
                nsqfLevel={c.nsqfLevel}
                reason={c.matchReason}
                isWorker={isWorker}
                onApply={c.verified ? () => {} : undefined}
                onVerify={!c.verified && isWorker ? () => handleVerify(c.id) : undefined}
              />
            ))}
          </div>
        );
      }
      case 'jobs': {
        const jobs = adaptJobs();
        return (
          <div className="space-y-3">
            {jobs.map((j) => (
              <div key={j.id} className="bg-white rounded-xl p-4 border-2 border-slate-200">
                <h3 className="font-bold text-slate-900">{j.title}</h3>
                <p className="text-xs text-slate-500">{j.company} · {j.wage}</p>
                <div className="flex gap-3 mt-2 text-xs font-bold text-slate-500">
                  <span>📍 {j.distanceKm} {t(language, 'match.km')}</span>
                  <span>💼 {j.vacancies}</span>
                  <span>📋 {j.type}</span>
                </div>
              </div>
            ))}
          </div>
        );
      }
      case 'aid': {
        const schemes = adaptFinancialAid();
        return (
          <div className="space-y-3">
            {schemes.map((s) => (
              <div key={s.id} className="bg-white rounded-xl p-4 border-2 border-[#F2B33D]">
                <h3 className="font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500">{s.maxAmount} · {s.subsidyRate}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {s.eligibility.map((e, i) => (
                    <span key={i} className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }
      case 'careers': {
        const careers = adaptCareers();
        return (
          <div className="space-y-3">
            {careers.map((c) => (
              <div key={c.id} className="bg-white rounded-xl p-4 border-2 border-slate-200">
                <h3 className="font-bold text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-500">{c.level} · {c.avgSalary}</p>
                <p className="text-xs text-slate-600 mt-1">{c.govtSupport}</p>
              </div>
            ))}
          </div>
        );
      }
      case 'community': {
        const mentors = adaptMentors();
        return (
          <div className="space-y-3">
            {mentors.map((m) => (
              <div key={m.id} className="bg-white rounded-xl p-4 border-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                    <p className="text-xs text-slate-500">{m.role}</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    m.available ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {m.available ? '✓' : '✗'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">{m.specialization}</p>
              </div>
            ))}
          </div>
        );
      }
      case 'planner': {
        const cells = adaptDistrictCells();
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3">{t(language, 'planner.title')}</h3>
              <div className="space-y-2">
                {cells.map((cell, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 w-20">{cell.block}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cell.gap > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (cell.demand / 40) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-16 text-right">
                      {cell.demand}/{cell.capacity}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {t(language, 'planner.demand')} / {t(language, 'planner.capacity')} — {t(language, 'planner.gap')} = {t(language, 'planner.gap')}
              </p>
            </div>
            <button className="w-full bg-[#2A3168] text-white font-bold text-sm py-2.5 rounded-xl">
              {t(language, 'planner.generateBrief')}
            </button>
          </div>
        );
      }
      case 'worker':
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200">
              <h3 className="font-bold text-slate-900">{t(language, 'worker.title')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t(language, 'worker.cases')}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">{t(language, 'worker.reviewProfile')}</h3>
              <p className="text-xs text-slate-500 mt-1">Review and correct beneficiary profiles before matching.</p>
            </div>
          </div>
        );
      case 'home':
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200">
              <h3 className="font-bold text-slate-900">{t(language, 'places.home')}</h3>
              <p className="text-sm text-slate-600 mt-2">आपका गाँव, आपकी यात्रा। यहाँ से आप अपने कौशल, नौकरियाँ और सहायता देख सकते हैं।</p>
            </div>
          </div>
        );
      case 'journey':
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200">
              <h3 className="font-bold text-slate-900">{t(language, 'journey.title')}</h3>
              <div className="space-y-2 mt-3">
                {['profileMade', 'referral', 'enrolled', 'trainingComplete', 'job'].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-[#F2B33D] text-[#2A3168]' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {i < 3 ? '✓' : i + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-700">{t(language, `journey.${stage}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const panelTitle = panelId === 'worker' ? t(language, 'worker.title')
    : panelId === 'planner' ? t(language, 'planner.title')
    : t(language, `places.${panelId}`) || panelId;

  return (
    <div className="w-full max-w-md mx-4 max-h-[70vh] flex flex-col">
      <div className="bg-[#FBF1DE] rounded-2xl border-4 border-[#2A3168] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#2A3168] px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{panelTitle}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center"
            aria-label={t(language, 'hud.close')}
          >
            ✕
          </button>
        </div>
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {renderContent()}
        </div>
        {/* Footer */}
        <div className="px-4 py-3 border-t-2 border-[#2A3168]/10">
          <button
            onClick={onClose}
            className="w-full bg-[#D9734E] hover:bg-[#c1633a] text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
          >
            ← {t(language, 'hud.backToVillage')}
          </button>
        </div>
      </div>
    </div>
  );
};
