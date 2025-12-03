export interface MetronomeState {
  isPlaying: boolean;
  currentBpm: number;
  currentBeat: number; // 0 to 3 usually
  nextNoteTime: number;
  barCount: number;
}

export interface PracticeSettings {
  startBpm: number;
  maxBpm: number;
  increaseAmount: number; // How many BPM to add
  increaseIntervalBars: number; // Add speed every X bars
  beatsPerBar: number;
}

export interface AIGeneratedRoutine {
  startBpm: number;
  increaseAmount: number;
  increaseIntervalBars: number;
  description: string;
}
