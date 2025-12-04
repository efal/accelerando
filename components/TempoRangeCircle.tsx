import React, { useState, useRef, useEffect } from 'react';

interface TempoRangeCircleProps {
    currentBpm: number;
    startBpm: number;
    maxBpm: number;
    onStartBpmChange: (bpm: number) => void;
    onMaxBpmChange: (bpm: number) => void;
    isPlaying: boolean;
    currentBeat: number;
    beatsPerBar: number;
    showMaxSlider?: boolean;
}

export const TempoRangeCircle: React.FC<TempoRangeCircleProps> = ({
    currentBpm,
    startBpm,
    maxBpm,
    onStartBpmChange,
    onMaxBpmChange,
    isPlaying,
    currentBeat,
    beatsPerBar,
    showMaxSlider = true
}) => {
    const [dragging, setDragging] = useState<'start' | 'max' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const MIN_BPM = 30;
    const MAX_BPM = 300;

    // Tachometer range: 225° (bottom-left) to 495° (bottom-right)
    // Total sweep: 270°
    const START_ANGLE = 225;
    const END_ANGLE = 495;
    const TOTAL_ANGLE = END_ANGLE - START_ANGLE;

    // Calculate angles (0° = top, clockwise)
    const bpmToAngle = (bpm: number) => {
        const ratio = (bpm - MIN_BPM) / (MAX_BPM - MIN_BPM);
        return START_ANGLE + ratio * TOTAL_ANGLE;
    };

    const startAngle = bpmToAngle(startBpm);
    const maxAngle = bpmToAngle(maxBpm);
    const currentAngle = bpmToAngle(currentBpm);

    // Convert polar to cartesian coordinates
    const polarToCartesian = (angle: number, radius: number) => {
        const angleInRadians = ((angle - 90) * Math.PI) / 180;
        return {
            x: radius * Math.cos(angleInRadians),
            y: radius * Math.sin(angleInRadians)
        };
    };

    const handleMouseDown = (type: 'start' | 'max') => (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(type);
    };

    const handleTouchStart = (type: 'start' | 'max') => (e: React.TouchEvent) => {
        e.preventDefault();
        setDragging(type);
    };

    const calculateBpmFromPosition = (clientX: number, clientY: number): number => {
        if (!containerRef.current) return 0;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        // Calculate angle in degrees (0° = top, clockwise)
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        // Normalize angle for tachometer range
        let effectiveAngle = angle;

        // Map 0..135 (top-right quadrant) to 360..495
        if (angle <= 135) {
            effectiveAngle = angle + 360;
        }

        // Handle the gap at the bottom (135° to 225°)
        if (angle > 135 && angle < 225) {
            // Snap to closest end
            if (angle < 180) effectiveAngle = END_ANGLE;
            else effectiveAngle = START_ANGLE;
        }

        // Clamp to valid range
        effectiveAngle = Math.max(START_ANGLE, Math.min(END_ANGLE, effectiveAngle));

        // Convert angle to BPM
        const ratio = (effectiveAngle - START_ANGLE) / TOTAL_ANGLE;
        const bpm = MIN_BPM + ratio * (MAX_BPM - MIN_BPM);

        return Math.round(Math.max(MIN_BPM, Math.min(MAX_BPM, bpm)));
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return;

            const newBpm = calculateBpmFromPosition(e.clientX, e.clientY);

            if (dragging === 'start') {
                // Ensure start BPM is less than or equal to max BPM
                if (newBpm <= maxBpm) {
                    onStartBpmChange(newBpm);
                }
            } else if (dragging === 'max') {
                // Ensure max BPM is greater than or equal to start BPM
                if (newBpm >= startBpm) {
                    onMaxBpmChange(newBpm);
                }
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!dragging || e.touches.length === 0) return;

            const touch = e.touches[0];
            const newBpm = calculateBpmFromPosition(touch.clientX, touch.clientY);

            if (dragging === 'start') {
                if (newBpm <= maxBpm) {
                    onStartBpmChange(newBpm);
                }
            } else if (dragging === 'max') {
                if (newBpm >= startBpm) {
                    onMaxBpmChange(newBpm);
                }
            }
        };

        const handleEnd = () => {
            setDragging(null);
        };

        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [dragging, startBpm, maxBpm, onStartBpmChange, onMaxBpmChange]);

    // Create SVG arc path for the tempo range
    // Create SVG arc path for the tempo range
    const createArcPath = () => {
        const radius = 140;
        const start = polarToCartesian(startAngle, radius);
        const end = polarToCartesian(maxAngle, radius);

        const largeArcFlag = maxAngle - startAngle > 180 ? 1 : 0;

        return `M ${160 + start.x} ${160 + start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${160 + end.x} ${160 + end.y}`;
    };

    // Background track arc (full tachometer range)
    const createTrackPath = () => {
        const radius = 140;
        const start = polarToCartesian(START_ANGLE, radius);
        const end = polarToCartesian(END_ANGLE, radius);

        const largeArcFlag = TOTAL_ANGLE > 180 ? 1 : 0;

        return `M ${160 + start.x} ${160 + start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${160 + end.x} ${160 + end.y}`;
    };

    const HANDLE_RADIUS = 140;
    const startHandle = polarToCartesian(startAngle, HANDLE_RADIUS);
    const maxHandle = polarToCartesian(maxAngle, HANDLE_RADIUS);
    const currentIndicator = polarToCartesian(currentAngle, 130);

    return (
        <div className="relative w-80 h-80 mb-12 flex items-center justify-center" ref={containerRef}>
            {/* SVG Layer for range and handles */}
            <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 320 320">
                {/* Background Track */}
                <path
                    d={createTrackPath()}
                    fill="none"
                    stroke="rgba(30, 41, 59, 0.5)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />

                {/* Tempo range arc */}
                <path
                    d={createArcPath()}
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.2)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />

                {/* Current BPM indicator line */}
                {isPlaying && (
                    <line
                        x1="160"
                        y1="160"
                        x2={160 + currentIndicator.x}
                        y2={160 + currentIndicator.y}
                        stroke="rgba(6, 182, 212, 0.8)"
                        strokeWidth="3"
                        className="transition-all duration-100"
                    />
                )}

                {/* Scale marks */}
                {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map(bpm => {
                    const angle = bpmToAngle(bpm);
                    // Push text further out for better visibility
                    const textPos = polarToCartesian(angle, 110);
                    const tickInner = polarToCartesian(angle, 134);
                    const tickOuter = polarToCartesian(angle, 146);

                    return (
                        <g key={bpm}>
                            <line
                                x1={160 + tickInner.x}
                                y1={160 + tickInner.y}
                                x2={160 + tickOuter.x}
                                y2={160 + tickOuter.y}
                                stroke="rgba(148, 163, 184, 0.5)"
                                strokeWidth="2"
                            />
                            <text
                                x={160 + textPos.x}
                                y={160 + textPos.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-sm fill-slate-300 font-bold"
                                style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}
                            >
                                {bpm}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Outer glow ring */}
            <div className={`absolute inset-0 rounded-full border-4 transition-all duration-150 ${isPlaying && currentBeat === 0
                ? 'border-cyan-400 scale-110 neon-glow-cyan neon-pulse'
                : 'border-cyan-900/30 scale-100'
                }`}></div>

            {/* Middle ring */}
            <div className={`absolute inset-8 rounded-full border-2 transition-all duration-100 ${isPlaying && currentBeat >= 0
                ? 'border-purple-500/50 neon-glow-purple'
                : 'border-purple-900/20'
                }`}></div>

            {/* Inner ring with glassmorphism */}
            <div className="absolute inset-16 rounded-full glass-card flex items-center justify-center">
                <div className="text-center">
                    <div className="text-8xl font-black text-neon-cyan tabular-nums tracking-tighter">
                        {Math.round(currentBpm)}
                    </div>
                    <div className="text-neon-purple font-bold uppercase tracking-[0.3em] text-sm mt-2">BPM</div>
                    <div className="text-purple-300/60 text-xs mt-3 font-semibold">
                        {startBpm} - {maxBpm}
                    </div>
                </div>
            </div>

            {/* Start BPM Handle */}
            <div
                className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                style={{
                    left: `calc(50% + ${startHandle.x}px - 20px)`,
                    top: `calc(50% + ${startHandle.y}px - 20px)`,
                    width: '40px',
                    height: '40px',
                    touchAction: 'none'
                }}
                onMouseDown={handleMouseDown('start')}
                onTouchStart={handleTouchStart('start')}
            >
                <div className={`w-full h-full rounded-full border-[3px] flex items-center justify-center transition-all ${dragging === 'start'
                    ? 'bg-green-500 border-green-300 neon-glow-green scale-125'
                    : 'bg-gradient-to-br from-green-600 to-emerald-600 border-green-400 hover:scale-110 neon-glow-green'
                    }`}>
                    <div className="text-white text-xs font-bold">S</div>
                </div>
            </div>

            {/* Start Label (Outside) */}
            <div
                className="absolute pointer-events-none transition-all duration-75"
                style={{
                    left: `calc(50% + ${polarToCartesian(startAngle, 190).x}px)`,
                    top: `calc(50% + ${polarToCartesian(startAngle, 190).y}px)`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-green-500/30">
                    <div className="text-green-300 text-sm font-bold">{startBpm}</div>
                    <div className="text-green-400/60 text-[9px] uppercase tracking-wider">Start</div>
                </div>
            </div>

            {/* Max BPM Handle */}
            {showMaxSlider && (
                <div
                    className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                    style={{
                        left: `calc(50% + ${maxHandle.x}px - 20px)`,
                        top: `calc(50% + ${maxHandle.y}px - 20px)`,
                        width: '40px',
                        height: '40px',
                        touchAction: 'none'
                    }}
                    onMouseDown={handleMouseDown('max')}
                    onTouchStart={handleTouchStart('max')}
                >
                    <div className={`w-full h-full rounded-full border-[3px] flex items-center justify-center transition-all ${dragging === 'max'
                        ? 'bg-red-500 border-red-300 neon-glow-red scale-125'
                        : 'bg-gradient-to-br from-red-600 to-rose-600 border-red-400 hover:scale-110 neon-glow-red'
                        }`}>
                        <div className="text-white text-xs font-bold">M</div>
                    </div>
                </div>
            )}

            {/* Max Label (Outside) */}
            {showMaxSlider && (
                <div
                    className="absolute pointer-events-none transition-all duration-75"
                    style={{
                        left: `calc(50% + ${polarToCartesian(maxAngle, 190).x}px)`,
                        top: `calc(50% + ${polarToCartesian(maxAngle, 190).y}px)`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-red-500/30">
                        <div className="text-red-300 text-sm font-bold">{maxBpm}</div>
                        <div className="text-red-400/60 text-[9px] uppercase tracking-wider">Max</div>
                    </div>
                </div>
            )}

            {/* Beat Indicators */}
            <div className="absolute -bottom-6 flex gap-6">
                {Array.from({ length: beatsPerBar }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-100 ${currentBeat === i
                            ? (i === 0
                                ? 'bg-cyan-400 neon-glow-cyan scale-150 beat-active'
                                : 'bg-pink-400 neon-glow-pink scale-125 beat-active')
                            : 'bg-slate-700/50 border border-slate-600/30'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};
