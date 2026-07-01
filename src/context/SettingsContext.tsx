import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAllSettings, setSetting } from '../db/settings';
import { Colors, palettes, ThemeMode } from '../theme';
import { MatchRules, DEFAULT_RULES } from '../lib/match';

export interface AppSettings {
  theme: ThemeMode;
  pointsPerSet: number;
  winByTwo: boolean;
  bestOf: number;
}

const DEFAULTS: AppSettings = {
  theme: 'light',
  pointsPerSet: DEFAULT_RULES.pointsPerSet,
  winByTwo: DEFAULT_RULES.winByTwo,
  bestOf: DEFAULT_RULES.bestOf,
};

interface Ctx {
  settings: AppSettings;
  colors: Colors;
  rules: MatchRules;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const SettingsContext = createContext<Ctx | null>(null);

function parse(raw: Record<string, string>): AppSettings {
  return {
    theme: raw.theme === 'dark' ? 'dark' : 'light',
    pointsPerSet: raw.pointsPerSet ? parseInt(raw.pointsPerSet, 10) : DEFAULTS.pointsPerSet,
    winByTwo: raw.winByTwo ? raw.winByTwo === 'true' : DEFAULTS.winByTwo,
    bestOf: raw.bestOf ? parseInt(raw.bestOf, 10) : DEFAULTS.bestOf,
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    getAllSettings().then((raw) => setSettings(parse(raw)));
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSetting(key, String(value));
  };

  const colors = palettes[settings.theme];
  const rules: MatchRules = {
    pointsPerSet: settings.pointsPerSet,
    winByTwo: settings.winByTwo,
    bestOf: settings.bestOf,
  };

  const value = useMemo<Ctx>(() => ({ settings, colors, rules, update }), [settings, colors]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function useColors(): Colors {
  return useSettings().colors;
}
