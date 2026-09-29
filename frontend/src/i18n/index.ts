import type { Language } from '../types';
import hi from './hi.json';
import en from './en.json';
import ta from './ta.json';
import bn from './bn.json';
import te from './te.json';

const dictionaries: Record<Language, Record<string, any>> = { hi, en, ta, bn, te };

export type TranslationKey = string;

export function t(lang: Language, key: TranslationKey): string {
  const dict = dictionaries[lang] ?? dictionaries.hi;
  const enDict = dictionaries.en;
  const val = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
  if (typeof val === 'string') return val;
  const enVal = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), enDict);
  if (typeof enVal === 'string') return enVal;
  return key;
}

export const languageNames: Record<Language, string> = {
  hi: 'हिंदी',
  en: 'English',
  ta: 'தமிழ்',
  bn: 'বাংলা',
  te: 'తెలుగు',
};

export const allLanguages: Language[] = ['hi', 'en', 'ta', 'bn', 'te'];
