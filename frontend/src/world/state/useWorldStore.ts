import { create } from 'zustand';
import type { Language } from '../../types';
import type { QualityTier } from '../engine/quality';

export type PlaceId =
  | 'home' | 'journey' | 'training' | 'jobs' | 'careers'
  | 'aid' | 'community' | 'assistant' | 'fieldWorker' | 'districtPlanner';

export type Role = 'beneficiary' | 'field_worker' | 'district_officer';

export type MitraState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type PanelId =
  | 'home' | 'journey' | 'training' | 'jobs' | 'careers'
  | 'aid' | 'community' | 'worker' | 'planner' | 'settings' | 'map' | null;

export interface PlaceInfo {
  id: PlaceId;
  position: [number, number, number];
  staffOnly?: boolean;
}

export const PLACES: PlaceInfo[] = [
  { id: 'home', position: [-18, 0, 10] },
  { id: 'journey', position: [0, 0, 0] },
  { id: 'training', position: [28, 0, -14] },
  { id: 'jobs', position: [22, 0, 18] },
  { id: 'careers', position: [-30, 0, -22] },
  { id: 'aid', position: [-8, 0, 26] },
  { id: 'community', position: [-2, 0, -18] },
  { id: 'assistant', position: [-2, 0, -14] },
  { id: 'fieldWorker', position: [12, 0, 8], staffOnly: true },
  { id: 'districtPlanner', position: [16, 0, -34], staffOnly: true },
];

export function placePosition(id: PlaceId): [number, number, number] {
  const p = PLACES.find((pl) => pl.id === id);
  return p ? p.position : [0, 0, 0];
}

interface WorldState {
  language: Language;
  role: Role;
  quality: QualityTier;
  timeOfDay: number;
  lockedToDay: boolean;
  currentPlace: PlaceId;
  activePanel: PanelId;
  mitraState: MitraState;
  mitraCaption: string;
  subtitle: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  captionsEnabled: boolean;
  textSize: 's' | 'm' | 'l' | 'xl';
  simpleMode: boolean;
  offlineMode: boolean;
  sampleDataBadge: boolean;
  journeyStage: number; // 0..5
  playerPosition: [number, number, number];
  firstVisitDone: boolean;

  setLanguage: (l: Language) => void;
  setRole: (r: Role) => void;
  setQuality: (q: QualityTier) => void;
  setTimeOfDay: (t: number) => void;
  setLockedToDay: (v: boolean) => void;
  setCurrentPlace: (p: PlaceId) => void;
  setActivePanel: (p: PanelId) => void;
  setMitraState: (s: MitraState) => void;
  setMitraCaption: (c: string) => void;
  setSubtitle: (s: string) => void;
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setCaptionsEnabled: (v: boolean) => void;
  setTextSize: (s: 's' | 'm' | 'l' | 'xl') => void;
  setSimpleMode: (v: boolean) => void;
  setOfflineMode: (v: boolean) => void;
  setJourneyStage: (s: number) => void;
  setPlayerPosition: (p: [number, number, number]) => void;
  setFirstVisitDone: (v: boolean) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  language: 'en',
  role: 'beneficiary',
  quality: 'medium',
  timeOfDay: 0.32,
  lockedToDay: false,
  currentPlace: 'home',
  activePanel: null,
  mitraState: 'idle',
  mitraCaption: '',
  subtitle: '',
  soundEnabled: true,
  musicEnabled: false,
  reduceMotion: false,
  highContrast: false,
  captionsEnabled: true,
  textSize: 'm',
  simpleMode: false,
  offlineMode: false,
  sampleDataBadge: false,
  journeyStage: 0,
  playerPosition: [-6, 6, 16],
  firstVisitDone: false,

  setLanguage: (language) => set({ language }),
  setRole: (role) => set({ role }),
  setQuality: (quality) => set({ quality }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setLockedToDay: (lockedToDay) => set({ lockedToDay }),
  setCurrentPlace: (currentPlace) => set({ currentPlace }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setMitraState: (mitraState) => set({ mitraState }),
  setMitraCaption: (mitraCaption) => set({ mitraCaption }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setHighContrast: (highContrast) => set({ highContrast }),
  setCaptionsEnabled: (captionsEnabled) => set({ captionsEnabled }),
  setTextSize: (textSize) => set({ textSize }),
  setSimpleMode: (simpleMode) => set({ simpleMode }),
  setOfflineMode: (offlineMode) => set({ offlineMode }),
  setJourneyStage: (journeyStage) => set({ journeyStage }),
  setPlayerPosition: (playerPosition) => set({ playerPosition }),
  setFirstVisitDone: (firstVisitDone) => set({ firstVisitDone }),
}));
