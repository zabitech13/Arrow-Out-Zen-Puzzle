import { ArrowHeadShape, ArrowStyleId, ChapterId, ThemeId, ThicknessLevel } from '../types/game';

export interface ThemeColors {
  id: ThemeId;
  name: string;
  bg: string;
  boardBg: string;
  boardBorder: string;
  gridLine: string;
  wallBg: string;
  wallBorder: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  accent: string;
  danger: string;
  safeHighlight: string;
  blockedDim: string;
}

export const THEMES: Record<ThemeId, ThemeColors> = {
  light: {
    id: 'light',
    name: 'Light Zen',
    bg: '#f9f8f6',
    boardBg: '#edebe6',
    boardBorder: '#ded9d0',
    gridLine: 'rgba(0, 0, 0, 0.04)',
    wallBg: '#b0aaa0',
    wallBorder: '#969086',
    textPrimary: '#1c1917',
    textSecondary: '#78716c',
    cardBg: '#ffffff',
    cardBorder: '#e7e5e4',
    accent: '#2563eb',
    danger: '#ef4444',
    safeHighlight: '#10b981',
    blockedDim: 'rgba(0, 0, 0, 0.18)',
  },
  dark: {
    id: 'dark',
    name: 'Deep Slate',
    bg: '#0f172a',
    boardBg: '#1e293b',
    boardBorder: '#334155',
    gridLine: 'rgba(255, 255, 255, 0.04)',
    wallBg: '#475569',
    wallBorder: '#64748b',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    accent: '#38bdf8',
    danger: '#f87171',
    safeHighlight: '#34d399',
    blockedDim: 'rgba(255, 255, 255, 0.15)',
  },
  amoled: {
    id: 'amoled',
    name: 'AMOLED Black',
    bg: '#000000',
    boardBg: '#111111',
    boardBorder: '#262626',
    gridLine: 'rgba(255, 255, 255, 0.06)',
    wallBg: '#2a2a2a',
    wallBorder: '#404040',
    textPrimary: '#ffffff',
    textSecondary: '#a3a3a3',
    cardBg: '#141414',
    cardBorder: '#282828',
    accent: '#60a5fa',
    danger: '#ff4d4f',
    safeHighlight: '#4ade80',
    blockedDim: 'rgba(255, 255, 255, 0.12)',
  },
  colorblind: {
    id: 'colorblind',
    name: 'High-Contrast Safe',
    bg: '#0a1128',
    boardBg: '#1c2541',
    boardBorder: '#3a506b',
    gridLine: 'rgba(255, 255, 255, 0.08)',
    wallBg: '#5bc0be',
    wallBorder: '#6fffe9',
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',
    cardBg: '#1c2541',
    cardBorder: '#3a506b',
    accent: '#ffd166',
    danger: '#ef476f',
    safeHighlight: '#06d6a0',
    blockedDim: 'rgba(255, 255, 255, 0.15)',
  },
};

export const CHAPTER_PALETTES: Record<ChapterId, { name: string; colors: string[] }> = {
  garden: {
    name: 'Garden',
    colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#d8f3dc'],
  },
  ocean: {
    name: 'Ocean',
    colors: ['#1d3557', '#457b9d', '#0077b6', '#0096c7', '#48cae4', '#90e0ef'],
  },
  night: {
    name: 'Night Sky',
    colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#38bdf8'],
  },
  desert: {
    name: 'Desert',
    colors: ['#bc6c25', '#dda15e', '#b08968', '#7f5539', '#9c6644', '#ddb892'],
  },
};

export const THICKNESS_PIXELS: Record<ThicknessLevel, number> = {
  slim: 2.5,
  regular: 4.0,
  bold: 5.5,
  heavy: 7.0,
};
