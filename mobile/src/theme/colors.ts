export const palette = {
  ink: '#17231F',
  muted: '#66746F',
  canvas: '#F7FAF8',
  surface: '#FFFFFF',
  line: '#E4ECE8',
  primary: '#0F766E',
  primarySoft: '#E3F5F1',
  accent: '#D97706',
  blue: '#2563EB',
  violet: '#7C3AED',
  danger: '#DC2626',
  success: '#059669',
  darkCanvas: '#0D1513',
  darkSurface: '#14211E',
  darkLine: '#263B36',
  darkInk: '#EEF7F4',
  darkMuted: '#A6B8B2',
};

export type AppColors = {
  background: string;
  surface: string;
  elevated: string;
  text: string;
  muted: string;
  line: string;
  primary: string;
  primarySoft: string;
  accent: string;
  danger: string;
  success: string;
};

export const lightColors: AppColors = {
  background: palette.canvas,
  surface: palette.surface,
  elevated: '#FBFDFC',
  text: palette.ink,
  muted: palette.muted,
  line: palette.line,
  primary: palette.primary,
  primarySoft: palette.primarySoft,
  accent: palette.accent,
  danger: palette.danger,
  success: palette.success,
};

export const darkColors: AppColors = {
  background: palette.darkCanvas,
  surface: palette.darkSurface,
  elevated: '#19302B',
  text: palette.darkInk,
  muted: palette.darkMuted,
  line: palette.darkLine,
  primary: '#2DD4BF',
  primarySoft: '#143A35',
  accent: '#F59E0B',
  danger: '#F87171',
  success: '#34D399',
};
