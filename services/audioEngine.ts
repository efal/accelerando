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
  private soundType: 'beep' | 'click' | 'woodblock' | 'cowbell' | 'kick' | 'snare' | 'drumset' = 'beep';

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

  public setSoundType(soundType: 'beep' | 'click' | 'woodblock' | 'cowbell' | 'kick' | 'snare' | 'drumset') {
    this.soundType = soundType;
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
    if (this.onBeatCallback) {
      const drawTime = (time - this.audioContext.currentTime) * 1000;
      setTimeout(() => {
        if (this.onBeatCallback) this.onBeatCallback(beatNumber, time);
      }, Math.max(0, drawTime));
    }

    // Choose sound based on soundType
    switch (this.soundType) {
      case 'beep':
        this.playBeep(beatNumber, time);
        break;
      case 'click':
        this.playClick(beatNumber, time);
        break;
      case 'woodblock':
        this.playWoodblock(beatNumber, time);
        break;
      case 'cowbell':
        this.playCowbell(beatNumber, time);
        break;
      case 'kick':
        this.playKick(beatNumber, time);
        break;
      case 'snare':
        this.playSnare(beatNumber, time);
        break;
      case 'drumset':
        this.playDrumset(beatNumber, time);
        break;
    }
  }

  private playBeep(beatNumber: number, time: number) {
    if (!this.audioContext) return;
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

  private playClick(beatNumber: number, time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Short, sharp click
    if (beatNumber === 0) {
      osc.frequency.value = 1500;
      gainNode.gain.value = 0.8;
    } else {
      osc.frequency.value = 1200;
      gainNode.gain.value = 0.5;
    }

    osc.start(time);
    osc.stop(time + 0.02); // Very short

    gainNode.gain.setValueAtTime(gainNode.gain.value, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
  }

  private playWoodblock(beatNumber: number, time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();

    osc.type = 'square';
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    if (beatNumber === 0) {
      osc.frequency.value = 800;
      filter.frequency.value = 1500;
      gainNode.gain.value = 0.7;
    } else {
      osc.frequency.value = 600;
      filter.frequency.value = 1200;
      gainNode.gain.value = 0.5;
    }

    filter.Q.value = 20;
    filter.type = 'bandpass';

    osc.start(time);
    osc.stop(time + 0.05);

    gainNode.gain.setValueAtTime(gainNode.gain.value, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  }

  private playCowbell(beatNumber: number, time: number) {
    if (!this.audioContext) return;
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();

    osc1.type = 'square';
    osc2.type = 'square';

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    if (beatNumber === 0) {
      osc1.frequency.value = 540;
      osc2.frequency.value = 800;
      gainNode.gain.value = 0.6;
    } else {
      osc1.frequency.value = 500;
      osc2.frequency.value = 750;
      gainNode.gain.value = 0.4;
    }

    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 10;

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.08);
    osc2.stop(time + 0.08);

    gainNode.gain.setValueAtTime(gainNode.gain.value, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  }

  private playKick(beatNumber: number, time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Kick drum: pitch sweep down
    if (beatNumber === 0) {
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
      gainNode.gain.value = 1.2;
    } else {
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
      gainNode.gain.value = 0.8;
    }

    osc.start(time);
    osc.stop(time + 0.15);

    gainNode.gain.setValueAtTime(gainNode.gain.value, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  }

  private playSnare(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    // Snare uses noise + sine
    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const osc = this.audioContext.createOscillator();
    osc.frequency.value = 200;

    const gainNode = this.audioContext.createGain();

    noise.connect(noiseFilter);
    noiseFilter.connect(gainNode);
    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    if (beatNumber === 0) {
      gainNode.gain.value = 0.8;
    } else {
      gainNode.gain.value = 0.5;
    }

    noise.start(time);
    osc.start(time);
    noise.stop(time + 0.15);
    osc.stop(time + 0.08);

    gainNode.gain.setValueAtTime(gainNode.gain.value, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  }

  private playDrumset(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const eighthNoteTime = secondsPerBeat / 2;

    // Kick drum on beats 1 and 3 (beatNumber 0 and 2 in 4/4)
    if (beatNumber === 0 || beatNumber === 2) {
      const kickOsc = this.audioContext.createOscillator();
      const kickGain = this.audioContext.createGain();

      kickOsc.connect(kickGain);
      kickGain.connect(this.audioContext.destination);

      kickOsc.frequency.setValueAtTime(150, time);
      kickOsc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
      kickGain.gain.value = 1.2;

      kickOsc.start(time);
      kickOsc.stop(time + 0.15);

      kickGain.gain.setValueAtTime(kickGain.gain.value, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    }

    // Snare drum on beats 2 and 4 (beatNumber 1 and 3 in 4/4)
    if (beatNumber === 1 || beatNumber === 3) {
      // Snare uses noise + sine
      const bufferSize = this.audioContext.sampleRate * 0.15;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.audioContext.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;

      const snareOsc = this.audioContext.createOscillator();
      snareOsc.frequency.value = 200;

      const snareGain = this.audioContext.createGain();

      noise.connect(noiseFilter);
      noiseFilter.connect(snareGain);
      snareOsc.connect(snareGain);
      snareGain.connect(this.audioContext.destination);

      snareGain.gain.value = 0.8;

      noise.start(time);
      snareOsc.start(time);
      noise.stop(time + 0.15);
      snareOsc.stop(time + 0.08);

      snareGain.gain.setValueAtTime(snareGain.gain.value, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    }

    // Hi-Hat on 8th notes (2 per beat)
    // Play at the beginning of the beat
    this.playHiHat(time, 0.3);

    // Play in the middle of the beat (8th note)
    this.playHiHat(time + eighthNoteTime, 0.2);
  }

  private playHiHat(time: number, volume: number) {
    if (!this.audioContext) return;

    // Hi-hat uses filtered noise
    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    filter.Q.value = 1;

    const gainNode = this.audioContext.createGain();

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    gainNode.gain.value = volume;

    noise.start(time);
    noise.stop(time + 0.05);

    gainNode.gain.setValueAtTime(gainNode.gain.value, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  }
}

export const audioEngine = new AudioEngine();
