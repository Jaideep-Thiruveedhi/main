import React, { useState } from 'react';
import { useWorldStore, PLACES } from '../world/state/useWorldStore';
import { t } from '../i18n';
import { MatchCard } from './MatchCard';
import { adaptRecommendations, adaptJobs, adaptFinancialAid, adaptCareers, adaptMentors, adaptDistrictCells } from '../world/adapters';
import { api } from '../lib/api';
import { voiceFAQData } from '../data/mockData';

// In-world panel styled like a Minecraft GUI / wooden sign / written book.

type VerifyState = 'idle' | 'building' | 'done' | 'failed';

const QUICK_ASKS = [
  { id: 'stipend', hi: 'वजीफा कितना मिलता है?', en: 'How much stipend do I get?' },
  { id: 'travel', hi: 'यात्रा का खर्चा कौन देगा?', en: 'Who pays my travel?' },
  { id: 'parttime', hi: 'क्या पढ़ाई के साथ काम कर सकते हैं?', en: 'Can I work while learning?' },
  { id: 'certificate', hi: 'सरकारी प्रमाण पत्र मिलेगा?', en: 'Will I get a certificate?' },
];

/** Mitra — the voice assistant. Four visible states, captions always on. */
const MitraPanel: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const mitraState = useWorldStore((s) => s.mitraState);
  const setMitraState = useWorldStore((s) => s.setMitraState);
  const mitraCaption = useWorldStore((s) => s.mitraCaption);
  const setMitraCaption = useWorldStore((s) => s.setMitraCaption);
  const captionsEnabled = useWorldStore((s) => s.captionsEnabled);

  const [answer, setAnswer] = useState('');
  const [supported] = useState(
    () => typeof window !== 'undefined' && !!(window as any).webkitSpeechRecognition
  );

  const speak = (text: string) => {
    setAnswer(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : language;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMitraState('listening');
      setMitraCaption(
        supported
          ? t(language, 'mitra.listening')
          : language === 'en'
            ? 'Speech input is not available in this browser. Tap a question below instead.'
            : 'इस ब्राउज़र में बोलकर पूछना उपलब्ध नहीं है। नीचे से प्रश्न चुनें।'
      );
      setTimeout(() => setMitraState('idle'), 2200);
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
        setAnswer(said || '');
        setMitraCaption(said || t(language, 'mitra.idle'));
        setTimeout(() => setMitraState('idle'), 2600);
      }, 900);
    };
    rec.onerror = () => {
      setMitraState('idle');
      setMitraCaption(t(language, 'mitra.idle'));
    };
    rec.onend = () => { if (mitraState === 'listening') setMitraState('idle'); };
    try { rec.start(); } catch { setMitraState('idle'); }
  };

  const ring =
    mitraState === 'listening' ? 'ring-listening'
      : mitraState === 'thinking' ? 'ring-thinking'
      : mitraState === 'speaking' ? 'ring-speaking'
      : 'ring-idle';

  return (
    <div className="space-y-4">
      {/* Voice orb with 4 visible states */}
      <div className="flex flex-col items-center gap-2 py-2">
        <button
          onClick={startMic}
          aria-label={t(language, 'hud.mic')}
          className={`orb ${ring}`}
        >
          <span className="text-4xl">🪔</span>
        </button>
        <p className="text-xs font-bold text-slate-600">
          {mitraState === 'listening' && t(language, 'mitra.listening')}
          {mitraState === 'thinking' && t(language, 'mitra.thinking')}
          {mitraState === 'speaking' && t(language, 'mitra.speaking')}
          {mitraState === 'idle' && t(language, 'mitra.idle')}
        </p>
      </div>

      {/* Captions / transcript, always visible */}
      {(mitraCaption || answer) && (
        <p className="bg-slate-900 text-white rounded-xl px-3 py-2 text-sm text-center" role="status" aria-live="polite">
          {answer || mitraCaption}
        </p>
      )}

      {/* Quick asks - no typing required */}
      <div>
        <p className="text-xs font-black text-slate-500 uppercase mb-2">
          {language === 'hi' ? 'प्रश्न चुनें' : 'Tap a question'}
        </p>
        <div className="space-y-2">
          {QUICK_ASKS.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                const faq = voiceFAQData.find((f) => f.id === `faq-${QUICK_ASKS.indexOf(q) + 1}`);
                speak(language === 'en' ? (faq?.answer ?? q.en) : (faq?.answerHi ?? q.hi));
                setMitraCaption(language === 'en' ? (faq?.answer ?? q.en) : (faq?.answerHi ?? q.hi));
              }}
              className="w-full text-left bg-white border-2 border-slate-200 hover:border-[#F2B33D] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 transition-colors"
            >
              {language === 'en' ? q.en : q.hi}
            </button>
          ))}
        </div>
      </div>

      {/* Replay / skip - always available */}
      <div className="flex gap-2">
        <button
          onClick={() => answer && speak(answer)}
          disabled={!answer}
          className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-sm py-2.5 rounded-xl"
        >
          🔁 {t(language, 'hud.replay')}
        </button>
        <button
          onClick={() => { setAnswer(''); setMitraCaption(''); setMitraState('idle'); }}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2.5 rounded-xl"
        >
          ⏭ {t(language, 'hud.skip')}
        </button>
      </div>
    </div>
  );
};

/** Map & compass - fast travel to every place, in the selected language. */
const MapPanel: React.FC<{ onGo: (place: string) => void }> = ({ onGo }) => {
  const language = useWorldStore((s) => s.language);
  const role = useWorldStore((s) => s.role);
  const playerPosition = useWorldStore((s) => s.playerPosition);
  const nearbyPlace = useWorldStore((s) => s.nearbyPlace);

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">{t(language, 'hud.goThere')}</p>
      {PLACES.map((p) => {
        const locked = p.staffOnly && role === 'beneficiary';
        const d = Math.hypot(p.position[0] - playerPosition[0], p.position[2] - playerPosition[2]);
        const here = nearbyPlace === p.id;
        return (
          <button
            key={p.id}
            disabled={locked}
            onClick={() => onGo(p.id)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
              locked ? 'bg-slate-50 opacity-50'
                : here ? 'bg-amber-50 border-2 border-[#F2B33D]'
                : 'bg-white border-2 border-slate-200 hover:border-[#F2B33D]'
            }`}
          >
            <span className="text-2xl">{locked ? '🔒' : '📍'}</span>
            <span className="flex-1">
              <span className="block font-bold text-slate-900">{t(language, `places.${p.id}`)}</span>
              {locked && <span className="text-xs text-slate-500">{t(language, 'hud.locked')}</span>}
            </span>
            <span className="text-xs font-bold text-slate-400">{d.toFixed(0)}m</span>
          </button>
        );
      })}
    </div>
  );
};

export const PlacePanel: React.FC<{ panelId: string; onClose: () => void }> = ({ panelId, onClose }) => {
  const language = useWorldStore((s) => s.language);
  const role = useWorldStore((s) => s.role);
  const setMitraCaption = useWorldStore((s) => s.setMitraCaption);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  // Centres flipped to Verified by this officer during this session.
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [verifyState, setVerifyState] = useState<Record<string, VerifyState>>({});

  const isWorker = role === 'field_worker';

  // Only a field-worker action can flip Interest -> Verified. The card is
  // hidden until the API confirms success.
  const handleVerify = async (centreId: string) => {
    setVerifyState((s) => ({ ...s, [centreId]: 'building' }));
    try {
      await api.verifyOpportunity(centreId);
      setVerifiedIds((ids) => [...ids, centreId]);
      setVerifyState((s) => ({ ...s, [centreId]: 'done' }));
      setMitraCaption(t(language, 'mitra.verifiedDone'));
    } catch (e: any) {
      setVerifyState((s) => ({ ...s, [centreId]: 'failed' }));
      setMitraCaption(t(language, 'mitra.verifyFailed'));
    }
  };

  const renderContent = () => {
    switch (panelId) {
      case 'training': {
        const centres = adaptRecommendations();
        return (
          <div className="space-y-3">
            {centres.map((c) => {
              // The 3D building flips to "built" only once the API confirmed.
              const verified = c.verified || verifiedIds.includes(c.id);
              const st = verifyState[c.id];
              return (
                <div key={c.id}>
                  <MatchCard
                    title={c.title}
                    verified={verified}
                    distanceKm={c.distanceKm}
                    seats={c.seats}
                    stipend={c.stipend}
                    nsqfLevel={c.nsqfLevel}
                    reason={c.matchReason}
                    isWorker={isWorker}
                    onApply={verified ? () => {} : undefined}
                    onVerify={!verified && isWorker ? () => handleVerify(c.id) : undefined}
                  />
                  {st === 'building' && (
                    <p className="mt-1 text-xs font-bold text-amber-700" role="status" aria-live="polite">
                      🧱 {t(language, 'worker.verifying')}
                    </p>
                  )}
                  {st === 'failed' && (
                    <p className="mt-1 text-xs font-bold text-rose-700" role="status" aria-live="polite">
                      {t(language, 'mitra.verifyFailed')}
                    </p>
                  )}
                </div>
              );
            })}
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
      case 'assistant':
        return <MitraPanel />;
      case 'map':
        return (
          <MapPanel
            onGo={(p) => {
              const panelId = p === 'fieldWorker' ? 'worker' : p === 'districtPlanner' ? 'planner' : p;
              setActivePanel(panelId as any);
              onClose();
            }}
          />
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
