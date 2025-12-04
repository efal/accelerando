import React, { useState, useRef, useEffect } from 'react';
import { Play, Square } from 'lucide-react';

interface PlayButtonWithDialProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    increaseAmount: number;
    onIncreaseAmountChange: (value: number) => void;
}

export const PlayButtonWithDial: React.FC<PlayButtonWithDialProps> = ({
    isPlaying,
    onTogglePlay,
    increaseAmount,
    onIncreaseAmountChange
}) => {
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const MIN_VALUE = 0;
    const MAX_VALUE = 10;

    // Dial covers 270 degrees (like the tempo circle)
    const START_ANGLE = 225;
    const END_ANGLE = 495;
    const TOTAL_ANGLE = END_ANGLE - START_ANGLE;

    const valueToAngle = (value: number) => {
        const ratio = (value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
        return START_ANGLE + ratio * TOTAL_ANGLE;
    };

    const polarToCartesian = (angle: number, radius: number) => {
        const angleInRadians = ((angle - 90) * Math.PI) / 180;
        return {
            x: radius * Math.cos(angleInRadians),
            y: radius * Math.sin(angleInRadians)
        };
    };

    const calculateValueFromPosition = (clientX: number, clientY: number): number => {
        if (!containerRef.current) return increaseAmount;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        let effectiveAngle = angle;
        if (angle <= 135) {
            effectiveAngle = angle + 360;
        }
        if (angle > 135 && angle < 225) {
            if (angle < 180) effectiveAngle = END_ANGLE;
            else effectiveAngle = START_ANGLE;
        }

        effectiveAngle = Math.max(START_ANGLE, Math.min(END_ANGLE, effectiveAngle));

        const ratio = (effectiveAngle - START_ANGLE) / TOTAL_ANGLE;
        const value = MIN_VALUE + ratio * (MAX_VALUE - MIN_VALUE);

        return Math.round(value);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Don't start dragging if clicking on the play button
        const target = e.target as HTMLElement;
        if (target.closest('.play-button')) return;

        e.preventDefault();
        setDragging(true);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.play-button')) return;

        e.preventDefault();
        setDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            const newValue = calculateValueFromPosition(e.clientX, e.clientY);
            onIncreaseAmountChange(newValue);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!dragging || e.touches.length === 0) return;
            const touch = e.touches[0];
            const newValue = calculateValueFromPosition(touch.clientX, touch.clientY);
            onIncreaseAmountChange(newValue);
        };

        const handleEnd = () => {
            setDragging(false);
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
    }, [dragging, onIncreaseAmountChange]);

    const currentAngle = valueToAngle(increaseAmount);
    const indicatorPos = polarToCartesian(currentAngle, 52);

    // Create track path
    const createTrackPath = () => {
        const radius = 52;
        const start = polarToCartesian(START_ANGLE, radius);
        const end = polarToCartesian(END_ANGLE, radius);
        return `M ${60 + start.x} ${60 + start.y} A ${radius} ${radius} 0 1 1 ${60 + end.x} ${60 + end.y}`;
    };

    // Create filled arc path
    const createFilledPath = () => {
        const radius = 52;
        const start = polarToCartesian(START_ANGLE, radius);
        const end = polarToCartesian(currentAngle, radius);
        const largeArcFlag = currentAngle - START_ANGLE > 180 ? 1 : 0;
        return `M ${60 + start.x} ${60 + start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${60 + end.x} ${60 + end.y}`;
    };

    return (
        <div
            ref={containerRef}
            className="relative w-[120px] h-[120px] flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'none' }}
        >
            {/* SVG Dial */}
            <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 120 120">
                {/* Background track */}
                <path
                    d={createTrackPath()}
                    fill="none"
                    stroke="rgba(30, 41, 59, 0.6)"
                    strokeWidth="8"
                    strokeLinecap="round"
                />

                {/* Filled portion */}
                {increaseAmount > 0 && (
                    <path
                        d={createFilledPath()}
                        fill="none"
                        stroke="rgba(168, 85, 247, 0.6)"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                )}

                {/* Scale marks */}
                {[0, 2, 4, 6, 8, 10].map(val => {
                    const angle = valueToAngle(val);
                    const innerPos = polarToCartesian(angle, 44);
                    const outerPos = polarToCartesian(angle, 48);
                    return (
                        <line
                            key={val}
                            x1={60 + innerPos.x}
                            y1={60 + innerPos.y}
                            x2={60 + outerPos.x}
                            y2={60 + outerPos.y}
                            stroke="rgba(148, 163, 184, 0.4)"
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Indicator dot */}
                <circle
                    cx={60 + indicatorPos.x}
                    cy={60 + indicatorPos.y}
                    r="6"
                    fill={increaseAmount > 0 ? "#a855f7" : "#64748b"}
                    stroke="white"
                    strokeWidth="2"
                    className="transition-all duration-75"
                />
            </svg>

            {/* Play Button */}
            <button
                onClick={onTogglePlay}
                className={`play-button w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 relative z-10 ${isPlaying
                        ? 'bg-gradient-to-br from-pink-600 to-red-600 border-2 border-pink-400 neon-glow-pink'
                        : 'bg-gradient-to-br from-cyan-600 to-blue-600 border-2 border-cyan-400 neon-glow-cyan'
                    }`}
            >
                {isPlaying
                    ? <Square fill="white" size={28} />
                    : <Play fill="white" className="ml-1" size={28} />
                }
            </button>

            {/* Value Display */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                <div className={`text-sm font-bold ${increaseAmount > 0 ? 'text-purple-300' : 'text-slate-500'}`}>
                    {increaseAmount > 0 ? `+${increaseAmount} BPM` : 'OFF'}
                </div>
                <div className="text-[9px] text-purple-400/60 uppercase tracking-wider">Speed Up</div>
            </div>
        </div>
    );
};
