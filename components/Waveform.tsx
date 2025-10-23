
import React, { useState, useEffect } from 'react';

interface WaveformProps {
  isListening: boolean;
  isSpeaking: boolean;
  isReceivingText: boolean;
}

const createWavePath = (amplitude: number, frequency: number, phase: number, length: number) => {
    let d = 'M 0 50';
    for (let x = 0; x <= length; x += 2) {
      const y = 50 + amplitude * Math.sin((x * frequency + phase) * Math.PI / 180);
      d += ` L ${x} ${y}`;
    }
    return d;
}

const createElectricPath = (startY: number, length: number, segments: number, maxOffset: number) => {
    let d = `M 0 ${startY + (Math.random() - 0.5) * 5}`;
    for (let i = 1; i <= segments; i++) {
        const x = (i / segments) * length;
        const y = startY + (Math.random() - 0.5) * maxOffset;
        d += ` L ${x} ${y}`;
    }
    return d;
}

const Waveform: React.FC<WaveformProps> = ({ isListening, isSpeaking, isReceivingText }) => {
    const isActive = isListening || isSpeaking || isReceivingText;
    const amplitudeMultiplier = isSpeaking ? 2.0 : isReceivingText ? 1.4 : isListening ? 1.0 : 0.5;
    const speedMultiplier = isSpeaking ? 1.5 : isReceivingText ? 1.2 : 1;
    const [electricPaths, setElectricPaths] = useState<string[]>([]);

    useEffect(() => {
        let intervalId: number | undefined;
        if (isActive) {
            intervalId = window.setInterval(() => {
                const intensity = isSpeaking ? 25 : isReceivingText ? 15 : 10;
                const newPaths = [
                    createElectricPath(50, 100, 15, intensity),
                    createElectricPath(50, 100, 10, intensity / 2),
                ];
                setElectricPaths(newPaths);
            }, 100);
        } else {
            setElectricPaths([]);
        }
        return () => clearInterval(intervalId);
    }, [isActive, isSpeaking, isReceivingText]);

    const waves = [
        { color: 'text-pink-400/80', amplitude: 8, frequency: 3, phase: 0, speed: 8 },
        { color: 'text-cyan-300/80', amplitude: 10, frequency: 2.5, phase: 90, speed: 10 },
        { color: 'text-white/90', amplitude: 6, frequency: 4, phase: 180, speed: 9 },
        { color: 'text-purple-400/70', amplitude: 12, frequency: 2, phase: 270, speed: 12 },
    ];
    
    return (
        <div className="w-full h-full flex justify-center items-center pointer-events-none opacity-90 mix-blend-lighten">
            <style>{`
                @keyframes flow {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
            `}</style>
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                preserveAspectRatio="none"
            >
                <defs>
                    <filter id="electric-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Base Sine Waves */}
                <g className="transition-transform duration-1000 ease-in-out" style={{ transform: `scaleY(${amplitudeMultiplier})`, transformOrigin: 'center' }}>
                    {waves.map((wave, i) => (
                        <path
                            key={i}
                            d={createWavePath(wave.amplitude, wave.frequency, wave.phase, 200)}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className={wave.color}
                            style={{
                                animation: isActive ? `flow ${wave.speed / speedMultiplier}s linear infinite` : 'none',
                            }}
                        />
                    ))}
                </g>

                {/* Electric Animation */}
                {isActive && (
                     <g filter="url(#electric-glow)">
                        {electricPaths.map((path, i) => (
                           <path
                             key={i}
                             d={path}
                             fill="none"
                             stroke="cyan"
                             strokeWidth={i === 0 ? "0.5" : "0.25"}
                             strokeLinecap="round"
                             className="opacity-80"
                           />
                        ))}
                     </g>
                )}
            </svg>
        </div>
    );
};

export default Waveform;
