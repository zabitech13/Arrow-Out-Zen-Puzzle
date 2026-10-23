import React, { useState } from 'react';
import {
  ArrowHeadShape,
  ArrowStyleId,
  ChapterId,
  GameMode,
  HapticIntensity,
  SoundPackId,
  ThemeId,
  ThicknessLevel,
  UserSettings,
} from '../types/game';
import { THEMES } from '../utils/theme';
import { sound } from '../utils/audio';
import {
  X,
  Sliders,
  Volume2,
  Eye,
  Shield,
  Database,
  Check,
  RotateCcw,
  Download,
  Upload,
} from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onResetProgress: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetProgress,
  onExportData,
  onImportData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'gameplay' | 'display' | 'sound' | 'accessibility' | 'data'
  >('gameplay');
  const [importText, setImportText] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const theme = THEMES[settings.theme] || THEMES.light;

  const update = (partial: Partial<UserSettings>) => {
    const next = { ...settings, ...partial };
    onUpdateSettings(next);

    // If sound pack or ambient config updated, notify sound engine
    if (
      partial.soundPack !== undefined ||
      partial.sfxVolume !== undefined ||
      partial.ambientVolume !== undefined ||
      partial.ambientMusic !== undefined
    ) {
      sound.setConfig(
        next.soundPack,
        next.sfxVolume,
        next.ambientVolume,
        next.ambientMusic
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-xl rounded-3xl p-6 shadow-2xl border flex flex-col max-h-[90vh] transition-colors"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
          <h2 className="text-lg font-bold tracking-tight">Game Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ color: theme.textSecondary }}
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto border-b text-xs font-semibold" style={{ borderColor: theme.cardBorder }}>
          {[
            { id: 'gameplay', label: 'Game Mode', icon: Sliders },
            { id: 'display', label: 'Display', icon: Eye },
            { id: 'sound', label: 'Sound', icon: Volume2 },
            { id: 'accessibility', label: 'Accessibility', icon: Shield },
            { id: 'data', label: 'Data', icon: Database },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs pr-1">
          {/* TAB 1: GAMEPLAY */}
          {activeTab === 'gameplay' && (
            <div className="space-y-5">
              <div>
                <label className="font-bold text-sm block mb-1">Game Mode</label>
                <p className="opacity-60 mb-2.5">
                  Pick your play style. You can change this at any time without penalty.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'RELAXED',
                      name: 'Relaxed',
                      desc: 'Infinite hearts, no penalties, gentle tilt on blocked taps.',
                    },
                    {
                      id: 'CLASSIC',
                      name: 'Classic (Default)',
                      desc: '3 hearts. Balanced, peaceful puzzle challenge.',
                    },
                    {
                      id: 'CHALLENGE',
                      name: 'Challenge',
                      desc: '1 heart only. Opt-in sudden death with bonus stars.',
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => update({ gameMode: mode.id as GameMode })}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        settings.gameMode === mode.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                          : 'hover:border-slate-400 opacity-80'
                      }`}
                      style={{ borderColor: settings.gameMode === mode.id ? undefined : theme.cardBorder }}
                    >
                      <div className="font-bold mb-1 flex items-center justify-between">
                        <span>{mode.name}</span>
                        {settings.gameMode === mode.id && <Check className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <p className="text-[11px] opacity-70 leading-normal">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Tap Mode */}
              <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: theme.cardBorder }}>
                <div>
                  <span className="font-bold block text-sm">Confirm Tap Protection</span>
                  <span className="opacity-60 text-[11px]">
                    First tap highlights the arrow, second tap releases it. Prevents accidental touches.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.confirmTap}
                  onChange={(e) => update({ confirmTap: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Smart Auto Hints */}
              <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: theme.cardBorder }}>
                <div>
                  <span className="font-bold block text-sm">Smart Auto-Hints</span>
                  <span className="opacity-60 text-[11px]">
                    Softly pulses a guaranteed safe arrow if idle for 20 seconds.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoHints}
                  onChange={(e) => update({ autoHints: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: DISPLAY */}
          {activeTab === 'display' && (
            <div className="space-y-5">
              {/* Theme Selection */}
              <div>
                <label className="font-bold text-sm block mb-1">Color Theme</label>
                <p className="opacity-60 mb-2.5">
                  High-contrast palettes designed for low-fatigue readability.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'light', name: 'Light Zen', previewBg: '#f9f8f6', previewFg: '#1c1917' },
                    { id: 'dark', name: 'Deep Slate', previewBg: '#0f172a', previewFg: '#f8fafc' },
                    { id: 'amoled', name: 'AMOLED Black', previewBg: '#000000', previewFg: '#ffffff' },
                    { id: 'colorblind', name: 'Colorblind-Safe', previewBg: '#0a1128', previewFg: '#ffd166' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => update({ theme: t.id as ThemeId })}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        settings.theme === t.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'hover:border-slate-400 opacity-80'
                      }`}
                      style={{
                        backgroundColor: t.previewBg,
                        color: t.previewFg,
                        borderColor: settings.theme === t.id ? '#3b82f6' : theme.cardBorder,
                      }}
                    >
                      <div className="font-bold text-xs">{t.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Arrow Thickness Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-sm">Arrow Thickness</label>
                  <span className="opacity-70 capitalize font-mono text-xs">{settings.arrowThickness}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['slim', 'regular', 'bold', 'heavy'] as ThicknessLevel[]).map((thick) => (
                    <button
                      key={thick}
                      onClick={() => update({ arrowThickness: thick })}
                      className={`py-2 px-3 rounded-xl border text-center capitalize transition-all ${
                        settings.arrowThickness === thick
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                      }`}
                      style={{ borderColor: settings.arrowThickness === thick ? undefined : theme.cardBorder }}
                    >
                      {thick}
                    </button>
                  ))}
                </div>
              </div>

              {/* Arrow Head Shape */}
              <div>
                <label className="font-bold text-sm block mb-1">Arrow Head Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['classic', 'chevron', 'diamond', 'arc'] as ArrowHeadShape[]).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => update({ arrowHeadShape: shape })}
                      className={`py-2 px-3 rounded-xl border text-center capitalize transition-all ${
                        settings.arrowHeadShape === shape
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                      }`}
                      style={{ borderColor: settings.arrowHeadShape === shape ? undefined : theme.cardBorder }}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduce Effects Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: theme.cardBorder }}>
                <div>
                  <span className="font-bold block text-sm">Reduce Effects</span>
                  <span className="opacity-60 text-[11px]">
                    No glow filters or extra spins; strictly serene minimal moves.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reduceEffects}
                  onChange={(e) => update({ reduceEffects: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SOUND */}
          {activeTab === 'sound' && (
            <div className="space-y-5">
              {/* ASMR Sound Pack Selector */}
              <div>
                <label className="font-bold text-sm block mb-1">ASMR Sound Pack</label>
                <p className="opacity-60 mb-2.5">
                  Synthesized with the Web Audio API. Pitch scales upward smoothly on combos!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'whoosh', name: 'Soft Whoosh', desc: 'Gentle airy glide' },
                    { id: 'wind', name: 'Wind', desc: 'Soft breeze resonance' },
                    { id: 'paper', name: 'Paper Slide', desc: 'Crisp origami tactile' },
                    { id: 'bubble', name: 'Bubble Pop', desc: 'Pleasant sine water pop' },
                    { id: 'silent', name: 'Silent', desc: 'No sound effects' },
                  ].map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => {
                        update({ soundPack: pack.id as SoundPackId });
                        if (pack.id !== 'silent') {
                          setTimeout(() => sound.playArrowExit(2), 50);
                        }
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        settings.soundPack === pack.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                          : 'hover:border-slate-400 opacity-80'
                      }`}
                      style={{ borderColor: settings.soundPack === pack.id ? undefined : theme.cardBorder }}
                    >
                      <div className="font-bold text-xs mb-0.5">{pack.name}</div>
                      <div className="text-[10px] opacity-70">{pack.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-sm">Effects Volume</span>
                  <span className="font-mono text-xs">{settings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sfxVolume}
                  onChange={(e) => update({ sfxVolume: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Ambient Music Toggle & Volume */}
              <div className="p-3.5 rounded-2xl border space-y-3" style={{ borderColor: theme.cardBorder }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-sm">Generative Ambient Music</span>
                    <span className="opacity-60 text-[11px]">
                      Gentle, evolving low-frequency drone & pentatonic chimes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.ambientMusic}
                    onChange={(e) => update({ ambientMusic: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {settings.ambientMusic && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="opacity-70 text-xs">Ambient Volume</span>
                      <span className="font-mono text-xs">{settings.ambientVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.ambientVolume}
                      onChange={(e) => update({ ambientVolume: Number(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACCESSIBILITY */}
          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              {/* Left-handed layout */}
              <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: theme.cardBorder }}>
                <div>
                  <span className="font-bold block text-sm">Left-Handed Mode</span>
                  <span className="opacity-60 text-[11px]">
                    Realigns power-ups and bottom action buttons for one-handed left thumb reach.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.leftHanded}
                  onChange={(e) => update({ leftHanded: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Bigger UI scale */}
              <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: theme.cardBorder }}>
                <div>
                  <span className="font-bold block text-sm">Bigger UI</span>
                  <span className="opacity-60 text-[11px]">
                    Enlarges power-up buttons, hearts, and counter labels for comfortable tapping.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.bigUI}
                  onChange={(e) => update({ bigUI: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Haptic intensity */}
              <div>
                <label className="font-bold text-sm block mb-1">Vibration / Haptics</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['off', 'light', 'medium', 'firm'] as HapticIntensity[]).map((intensity) => (
                    <button
                      key={intensity}
                      onClick={() => update({ hapticIntensity: intensity })}
                      className={`py-2 px-3 rounded-xl border text-center capitalize transition-all ${
                        settings.hapticIntensity === intensity
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                      }`}
                      style={{ borderColor: settings.hapticIntensity === intensity ? undefined : theme.cardBorder }}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: theme.cardBorder }}>
                <div>
                  <span className="font-bold block text-sm">Reduced Motion</span>
                  <span className="opacity-60 text-[11px]">
                    Disables camera float, tilt shakes, and flying arcs.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => update({ reducedMotion: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 5: DATA */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl border space-y-3" style={{ borderColor: theme.cardBorder }}>
                <span className="font-bold block text-sm">Save & Export Progress</span>
                <p className="opacity-60 text-[11px]">
                  All game data is stored directly in your browser localStorage. You can export a backup JSON file or import previously saved data.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onExportData}
                    className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Save File</span>
                  </button>
                </div>
              </div>

              {/* Import Data */}
              <div className="p-3.5 rounded-2xl border space-y-3" style={{ borderColor: theme.cardBorder }}>
                <span className="font-bold block text-sm">Import Save JSON</span>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste exported save JSON here..."
                  className="w-full h-20 p-2 text-[11px] font-mono rounded-xl border bg-black/5 dark:bg-white/5 focus:outline-none"
                  style={{ borderColor: theme.cardBorder }}
                />
                <button
                  onClick={() => {
                    if (importText.trim()) {
                      onImportData(importText.trim());
                      setImportText('');
                    }
                  }}
                  disabled={!importText.trim()}
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-blue-600 text-white disabled:opacity-40 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore Data</span>
                </button>
              </div>

              {/* Reset Data */}
              <div className="p-3.5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-2">
                <span className="font-bold block text-sm text-red-500">Reset All Progress</span>
                <p className="opacity-60 text-[11px]">
                  Resets all stars, level progress, and unlocked cosmetics back to default.
                </p>
                {showConfirmReset ? (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        onResetProgress();
                        setShowConfirmReset(false);
                      }}
                      className="py-1.5 px-3 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all"
                    >
                      Yes, Reset Everything
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="py-1.5 px-3 rounded-xl text-xs font-semibold opacity-70 hover:opacity-100"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="py-1.5 px-3 rounded-xl text-xs font-semibold text-red-600 border border-red-500/30 hover:bg-red-500/10 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Game Data</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
