import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings2, RefreshCw, Volume2, Zap } from 'lucide-react';
import { audioEngine } from './services/audioEngine';

import { Knob } from './components/Knob';
import { TempoRangeCircle } from './components/TempoRangeCircle';
import { PracticeSettings } from './types';

const App: React.FC = () => {
  // State for Settings
  const [settings, setSettings] = useState<PracticeSettings>({
    startBpm: 80,
    maxBpm: 200,
    increaseAmount: 0,
    increaseIntervalBars: 4,
    beatsPerBar: 4
  });

  const [soundType, setSoundType] = useState<'beep' | 'click' | 'woodblock' | 'cowbell' | 'kick' | 'snare' | 'drumset'>('beep');

  // Runtime State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(settings.startBpm);
  const [currentBeat, setCurrentBeat] = useState(-1);


  // Initialize Audio Engine settings whenever React state changes
  useEffect(() => {
    audioEngine.setSettings(
      currentBpm,
      settings.beatsPerBar,
      settings.increaseAmount,
      settings.increaseIntervalBars,
      settings.maxBpm
    );
  }, [settings, currentBpm]);

  // Update sound type
  useEffect(() => {
    audioEngine.setSoundType(soundType);
  }, [soundType]);

  // Setup Engine Callbacks only once
  useEffect(() => {
    audioEngine.setOnBeat((beat) => {
      setCurrentBeat(beat);
    });

    audioEngine.setOnBpmChange((newBpm) => {
      // We update the 'current' display without changing the 'start' setting
      setCurrentBpm(newBpm);
    });
  }, []);

  const togglePlay = () => {
    if (!isPlaying) {
      // Reset BPM to start value if we stopped and started again
      setCurrentBpm(settings.startBpm);
      audioEngine.setSettings(
        settings.startBpm,
        settings.beatsPerBar,
        settings.increaseAmount,
        settings.increaseIntervalBars,
        settings.maxBpm
      );
      audioEngine.start();
      setIsPlaying(true);
    } else {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentBeat(-1);
    }
  };

  const exportPreset = () => {
    const preset = {
      name: `Accelerando_Preset_${new Date().toISOString().slice(0, 10)}`,
      settings: {
        ...settings,
        soundType: soundType
      }
    };

    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importPreset = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const preset = JSON.parse(e.target?.result as string);
        if (preset.settings) {
          const { soundType: importedSound, ...importedSettings } = preset.settings;
          setSettings(importedSettings);
          if (importedSound) setSoundType(importedSound);
          if (!isPlaying) setCurrentBpm(importedSettings.startBpm);
        }
      } catch (error) {
        console.error('Failed to import preset:', error);
        alert('Failed to import preset. Please check the file format.');
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };


  return (
    <div className="min-h-screen relative flex flex-col items-center py-8 px-4 font-sans">

      {/* Enhanced floating particles and animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-cyan-400 opacity-60 floating-particle" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-purple-400 opacity-40 floating-particle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-2 h-2 rounded-full bg-pink-400 opacity-50 floating-particle" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-cyan-400 opacity-30 floating-particle" style={{ animationDelay: '1s' }}></div>

        {/* Additional particles */}
        <div className="absolute top-60 left-1/3 w-2 h-2 rounded-full bg-purple-300 opacity-50 floating-particle" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-40 right-1/4 w-3 h-3 rounded-full bg-cyan-300 opacity-45 floating-particle" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-20 w-2 h-2 rounded-full bg-pink-300 opacity-35 floating-particle" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute bottom-60 right-10 w-2 h-2 rounded-full bg-purple-400 opacity-55 floating-particle" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-80 right-1/2 w-3 h-3 rounded-full bg-cyan-400 opacity-40 floating-particle" style={{ animationDelay: '3.5s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-2 h-2 rounded-full bg-pink-400 opacity-45 floating-particle" style={{ animationDelay: '4.5s' }}></div>

        {/* Pulsing orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl pulsing-orb" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl pulsing-orb" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-36 h-36 rounded-full bg-pink-500/10 blur-3xl pulsing-orb" style={{ animationDelay: '4s' }}></div>

        {/* Scanning lines */}
        <div className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent scanning-line" style={{ animationDelay: '0s' }}></div>
        <div className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent scanning-line" style={{ animationDelay: '3s' }}></div>
      </div>

      <header className="mb-12 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Zap className="text-neon-cyan" size={36} />
          <h1 className="text-5xl font-black text-neon-cyan tracking-wider">
            ACCELERANDO
          </h1>
          <Zap className="text-neon-cyan" size={36} />
        </div>
        <p className="text-purple-300 text-sm tracking-widest uppercase">Speed Trainer • Neon Edition</p>
      </header>

      {/* Main BPM Display - Neon Ring with Integrated Controls */}
      <TempoRangeCircle
        currentBpm={currentBpm}
        startBpm={settings.startBpm}
        maxBpm={settings.maxBpm}
        onStartBpmChange={(v) => {
          setSettings(s => ({ ...s, startBpm: v }));
          if (!isPlaying) setCurrentBpm(v);
        }}
        onMaxBpmChange={(v) => setSettings(s => ({ ...s, maxBpm: v }))}
        isPlaying={isPlaying}
        currentBeat={currentBeat}
        beatsPerBar={settings.beatsPerBar}
      />

      {/* Play/Stop Button - Neon Style */}
      <div className="mb-8 relative z-10">
        <button
          onClick={togglePlay}
          className={`
            btn-neon w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 relative
            ${isPlaying
              ? 'bg-gradient-to-br from-pink-600 to-red-600 border-2 border-pink-400 neon-glow-pink'
              : 'bg-gradient-to-br from-cyan-600 to-blue-600 border-2 border-cyan-400 neon-glow-cyan'}
          `}
        >
          {isPlaying
            ? <Square fill="white" size={40} className="relative z-10" />
            : <Play fill="white" className="ml-1 relative z-10" size={40} />}
        </button>
      </div>

      {/* Sound Selection */}
      <div className="mb-8 relative z-10">
        <div className="glass-card p-4 inline-block">
          <div className="flex items-center gap-4">
            <span className="text-cyan-300 text-xs font-bold uppercase tracking-widest">Sound:</span>
            <div className="flex gap-2">
              {(['beep', 'click', 'woodblock', 'cowbell', 'kick', 'snare', 'drumset'] as const).map((sound) => (
                <button
                  key={sound}
                  onClick={() => setSoundType(sound)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${soundType === sound
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 neon-glow-cyan'
                    : 'bg-black/20 text-slate-400 border border-slate-600/30 hover:border-cyan-400/30 hover:text-cyan-400'
                    }`}
                >
                  {sound === 'beep' && '🔊'}
                  {sound === 'click' && '⚡'}
                  {sound === 'woodblock' && '🎵'}
                  {sound === 'cowbell' && '🔔'}
                  {sound === 'kick' && '🥁'}
                  {sound === 'snare' && '🎼'}
                  {sound === 'drumset' && '🥁'}
                  <span className="ml-1">{sound}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Import/Export Presets */}
      <div className="mb-8 relative z-10">
        <div className="glass-card p-4 inline-block">
          <div className="flex items-center gap-4">
            <span className="text-purple-300 text-xs font-bold uppercase tracking-widest">Presets:</span>
            <div className="flex gap-2">
              <button
                onClick={exportPreset}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all bg-purple-500/20 text-purple-300 border border-purple-400/30 hover:border-purple-400/60 hover:bg-purple-500/30 hover:neon-glow-purple"
              >
                💾 Export
              </button>
              <label className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-500/30 hover:neon-glow-cyan cursor-pointer">
                📂 Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importPreset}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* All Controls in Single Horizontal Row */}
      <div className="w-full max-w-7xl mb-8 relative z-10">
        <div className="glass-card p-8">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">

            <div className="w-full sm:w-auto">
              <Knob
                label="Time Signature"
                value={settings.beatsPerBar}
                onChange={(v) => setSettings({ ...settings, beatsPerBar: v })}
                min={1} max={12}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Knob
                label="Increase By"
                value={settings.increaseAmount}
                onChange={(v) => setSettings({ ...settings, increaseAmount: v })}
                min={0} max={10} unit="BPM"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Knob
                label="Every N Bars"
                value={settings.increaseIntervalBars}
                onChange={(v) => setSettings({ ...settings, increaseIntervalBars: v })}
                min={1} max={32}
              />
            </div>

          </div>
          <p className="text-xs text-purple-200/60 mt-6 text-center">
            {settings.increaseAmount > 0
              ? `⚡ Trainer active: +${settings.increaseAmount} BPM every ${settings.increaseIntervalBars} bars`
              : "Trainer disabled"}
          </p>
        </div>
      </div>

      {/* AI Coach Section Removed */}

      <footer className="mt-16 text-slate-600 text-xs relative z-10">
        <span className="text-cyan-500/50">⚡</span> {new Date().getFullYear()} ACCELERANDO <span className="text-cyan-500/50">⚡</span>
      </footer>
    </div>
  );
};



export default App;
