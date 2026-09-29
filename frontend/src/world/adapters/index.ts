import type { RecommendationCard, JobOpportunity, FinancialScheme, CareerNode, Mentor } from '../../types';
import { recommendationsData, jobOpportunitiesData, financialSchemesData, careerPathwaysData, mentorsData } from '../../data/mockData';

// Maps API/mock data shapes to world entities. Single place for all data adaptation.

export interface CentreBuilding {
  id: string;
  title: string;
  position: [number, number, number];
  distanceKm: number;
  verified: boolean;
  ghost: boolean;
  seats: number;
  stipend?: string;
  nsqfLevel: number;
  matchReason: string;
}

export interface JobStall {
  id: string;
  title: string;
  company: string;
  wage: string;
  distanceKm: number;
  vacancies: number;
  type: string;
  position: [number, number, number];
}

export interface AidChest {
  id: string;
  title: string;
  maxAmount: string;
  subsidyRate: string;
  status: string;
  eligibility: string[];
  documents: string[];
}

export interface CareerTerrace {
  id: string;
  title: string;
  pathway: string;
  level: string;
  avgSalary: string;
  govtSupport: string;
  position: [number, number, number];
}

export interface MentorNpc {
  id: string;
  name: string;
  role: string;
  specialization: string;
  available: boolean;
  position: [number, number, number];
}

// Training centre positions in the world (matches terrain generation)
const CENTRE_POSITIONS: [number, number, number][] = [
  [20, 5, -18],   // near - verified
  [30, 5, -18],   // far - ghost (interest match)
  [25, 5, -10],   // medium - verified
];

export function adaptRecommendations(recs?: RecommendationCard[]): CentreBuilding[] {
  const data = recs ?? recommendationsData;
  return data.map((r, i) => ({
    id: r.id,
    title: r.title,
    position: CENTRE_POSITIONS[i % CENTRE_POSITIONS.length],
    distanceKm: r.distanceKm,
    verified: r.batchConfirmed,
    ghost: !r.batchConfirmed,
    seats: 20,
    stipend: r.stipend,
    nsqfLevel: r.nsqfLevel,
    matchReason: r.matchReason,
  }));
}

export function adaptJobs(jobs?: JobOpportunity[]): JobStall[] {
  const data = jobs ?? jobOpportunitiesData;
  return data.map((j, i) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    wage: j.wage,
    distanceKm: j.distanceKm,
    vacancies: j.vacancies,
    type: j.type,
    position: [18 + (i % 3) * 4, 5, 14 + Math.floor(i / 3) * 5] as [number, number, number],
  }));
}

export function adaptFinancialAid(schemes?: FinancialScheme[]): AidChest[] {
  const data = schemes ?? financialSchemesData;
  return data.map((s) => ({
    id: s.id,
    title: s.title,
    maxAmount: s.maxAmount,
    subsidyRate: s.subsidyRate,
    status: s.status,
    eligibility: s.eligibility,
    documents: s.documents,
  }));
}

export function adaptCareers(careers?: CareerNode[]): CareerTerrace[] {
  const data = careers ?? careerPathwaysData;
  return data.map((c, i) => ({
    id: c.id,
    title: c.title,
    pathway: c.pathway,
    level: c.level,
    avgSalary: c.avgSalary,
    govtSupport: c.govtSupport,
    position: [-38 + (i % 3) * 3, 5 + Math.floor(i / 3) * 2, -30 + Math.floor(i / 3) * 3] as [number, number, number],
  }));
}

export function adaptMentors(mentors?: Mentor[]): MentorNpc[] {
  const data = mentors ?? mentorsData;
  return data.map((m, i) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    specialization: m.specialization,
    available: m.availableToday,
    position: [-4 + i * 3, 5, -16 + i * 2] as [number, number, number],
  }));
}

// District planning data (from Layer 5 API or mock)
export interface DistrictCell {
  block: string;
  trade: string;
  demand: number;
  capacity: number;
  gap: number;
  verified: boolean;
}

export function adaptDistrictCells(): DistrictCell[] {
  return [
    { block: 'बहजोई', trade: 'मशरूम', demand: 36, capacity: 0, gap: 36, verified: false },
    { block: 'छजलेट', trade: 'मशरूम', demand: 20, capacity: 9, gap: 11, verified: true },
    { block: 'मुरादाबाद ग्रामीण', trade: 'सोलर', demand: 17, capacity: 14, gap: 3, verified: true },
    { block: 'बिलारी', trade: 'जीडीए', demand: 9, capacity: 0, gap: 9, verified: false },
    { block: 'कुंदरकी', trade: 'सिलाई', demand: 11, capacity: 0, gap: 11, verified: false },
  ];
}
