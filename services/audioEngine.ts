// This service manages the Web Audio API context for precise timing.
// React state is too slow for musical timing, so we use the "lookahead" scheduling technique.

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private nextNoteTime: number = 0.0;
  private currentBeat: number = 0;
  private barCount: number = 0;
  private timerID: number | undefined;
  
  // Schedule ahead time (how far ahead to schedule audio)
  private scheduleAheadTime: number = 0.1; 
  // Lookahead interval (how often to call scheduling function)
  private lookahead: number = 25.0; 

  // Callbacks for UI updates
  private onBeatCallback: ((beat: number, time: number) => void) | null = null;
  private onBpmChangeCallback: ((bpm: number) => void) | null = null;

  // Settings
  private bpm: number = 60;
  private beatsPerBar: number = 4;
  
  // Speed Trainer Settings
  private increaseAmount: number = 0;
  private increaseIntervalBars: number = 0;
  private maxBpm: number = 200;

  constructor() {
    // AudioContext is initialized on user interaction
  }

  public init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public setSettings(
    bpm: number, 
    beatsPerBar: number, 
    increaseAmount: number, 
    increaseIntervalBars: number,
    maxBpm: number
  ) {
    this.bpm = bpm;
    this.beatsPerBar = beatsPerBar;
    this.increaseAmount = increaseAmount;
    this.increaseIntervalBars = increaseIntervalBars;
    this.maxBpm = maxBpm;
  }

  public setOnBeat(callback: (beat: number, time: number) => void) {
    this.onBeatCallback = callback;
  }

  public setOnBpmChange(callback: (bpm: number) => void) {
    this.onBpmChangeCallback = callback;
  }

  public start() {
    if (this.isPlaying) return;
    this.init();
    
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentBeat = 0;
    this.barCount = 0;
    this.nextNoteTime = this.audioContext!.currentTime + 0.1;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
    }
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  // The scheduler loop handles the timing
  private scheduler() {
    if (!this.isPlaying || !this.audioContext) return;

    // While there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      this.nextNote();
    }

    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  // Advance current note and time
  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;

    this.currentBeat++;
    
    if (this.currentBeat === this.beatsPerBar) {
      this.currentBeat = 0;
      this.barCount++;
      
      // Speed Trainer Logic: Happens at the start of a new bar
      if (this.increaseAmount > 0 && this.increaseIntervalBars > 0) {
        if (this.barCount % this.increaseIntervalBars === 0) {
          this.handleSpeedIncrease();
        }
      }
    }
  }

  private handleSpeedIncrease() {
    const newBpm = Math.min(this.bpm + this.increaseAmount, this.maxBpm);
    if (newBpm !== this.bpm) {
      this.bpm = newBpm;
      if (this.onBpmChangeCallback) {
        this.onBpmChangeCallback(this.bpm);
      }
    }
  }

  // Play the sound
  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    // Notify UI (for visual blink)
    // We use a slight delay or requestAnimationFrame in UI to sync visually, 
    // but here we just send the message.
    if (this.onBeatCallback) {
       // We can't update UI exactly at 'time' because 'time' is in the future.
       // However, for React visual feedback, triggering "now" is usually acceptable 
       // unless latency is huge. For strict sync, we'd use DrawNodes, but simple state is fine here.
       const drawTime = (time - this.audioContext.currentTime) * 1000;
       setTimeout(() => {
         if(this.onBeatCallback) this.onBeatCallback(beatNumber, time);
       }, Math.max(0, drawTime));
    }

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // High pitch for beat 1, lower for others
    if (beatNumber === 0) {
      osc.frequency.value = 1000;
      gainNode.gain.value = 1; 
    } else {
      osc.frequency.value = 800;
      gainNode.gain.value = 0.6; 
    }

    osc.start(time);
    osc.stop(time + 0.1);
    
    // Smooth decay to avoid clicking
    gainNode.gain.setValueAtTime(gainNode.gain.value, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  }
}

export const audioEngine = new AudioEngine();
