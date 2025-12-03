import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface KnobProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

export const Knob: React.FC<KnobProps> = ({ label, value, onChange, min = 1, max = 300, unit = '' }) => {
  return (
    <div className="flex flex-col items-center bg-black/30 p-5 rounded-xl border border-cyan-500/20 w-full hover:border-cyan-400/40 transition-all">
      <span className="text-cyan-300 text-xs font-bold uppercase tracking-widest mb-3">{label}</span>
      <div className="flex items-center gap-4 w-full">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="p-2.5 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 hover:from-cyan-900 hover:to-blue-900 transition-all text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/60 hover:neon-glow-cyan"
        >
          <Minus size={16} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-3xl font-black text-white tabular-nums">
            {value}<span className="text-sm text-purple-400/70 ml-2 font-semibold">{unit}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full mt-3"
          />
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="p-2.5 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 hover:from-cyan-900 hover:to-blue-900 transition-all text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/60 hover:neon-glow-cyan"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
