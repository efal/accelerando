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
    <div className="flex flex-col items-center bg-slate-800 p-4 rounded-xl border border-slate-700 w-full">
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</span>
      <div className="flex items-center gap-4 w-full">
        <button 
          onClick={() => onChange(Math.max(min, value - 1))}
          className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-white"
        >
          <Minus size={16} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {value}<span className="text-sm text-slate-500 ml-1 font-normal">{unit}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full mt-2"
          />
        </div>
        <button 
          onClick={() => onChange(Math.min(max, value + 1))}
          className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-white"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
