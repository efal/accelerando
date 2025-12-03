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
    <div className="flex flex-col items-center bg-black/5 backdrop-blur-sm p-6 rounded-xl border border-cyan-500/8 min-w-[240px] hover:border-cyan-400/25 transition-all">
      <span className="text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4">{label}</span>
      <div className="flex items-center gap-6 w-full">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="p-3 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 hover:from-cyan-900 hover:to-blue-900 transition-all text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/60 hover:neon-glow-cyan flex-shrink-0"
        >
          <Minus size={18} />
        </button>
        <div className="flex-1 text-center min-w-[120px]">
          <div className="text-3xl font-black text-white tabular-nums">
            {value}<span className="text-sm text-purple-400/70 ml-2 font-semibold">{unit}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full mt-4"
          />
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="p-3 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 hover:from-cyan-900 hover:to-blue-900 transition-all text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/60 hover:neon-glow-cyan flex-shrink-0"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};
