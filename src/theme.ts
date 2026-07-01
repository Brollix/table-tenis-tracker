export type ThemeMode = 'light' | 'dark';

export interface Colors {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  success: string;
  successMuted: string;
  danger: string;
  inputBg: string;
  tabBar: string;
  header: string;
  overlay: string;
  toggleBg: string;
}

const light: Colors = {
  bg: '#F9FAFB',
  card: '#FFFFFF',
  cardAlt: '#FAFAFA',
  text: '#111827',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  border: '#F3F4F6',
  borderStrong: '#D1D5DB',
  primary: '#2563EB',
  primaryMuted: '#DBEAFE',
  onPrimary: '#FFFFFF',
  success: '#16A34A',
  successMuted: '#DCFCE7',
  danger: '#DC2626',
  inputBg: '#F9FAFB',
  tabBar: '#FFFFFF',
  header: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.3)',
  toggleBg: '#F3F4F6',
};

const dark: Colors = {
  bg: '#0B0F19',
  card: '#161B26',
  cardAlt: '#1A2030',
  text: '#F3F4F6',
  textMuted: '#9CA3AF',
  textFaint: '#6B7280',
  border: '#252C3A',
  borderStrong: '#374151',
  primary: '#3B82F6',
  primaryMuted: '#1E3A5F',
  onPrimary: '#FFFFFF',
  success: '#22C55E',
  successMuted: '#14331F',
  danger: '#F87171',
  inputBg: '#111827',
  tabBar: '#111827',
  header: '#111827',
  overlay: 'rgba(0,0,0,0.6)',
  toggleBg: '#1F2737',
};

export const palettes: Record<ThemeMode, Colors> = { light, dark };
