
import React from 'react';

interface MicButtonProps {
  isConnecting: boolean;
  isConnected: boolean;
  isListening: boolean;
  onClick: () => void;
}

const MicIcon: React.FC<{className?: string}> = ({className}) => (
    <>
        <svg width="0" height="0" className="absolute">
            <defs>
                <linearGradient id="mic-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00A8E8" />
                    <stop offset="100%" stopColor="#FF6B6B" />
                </linearGradient>
            </defs>
        </svg>
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="url(#mic-gradient)">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
            <path d="M17 11h-1c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92z"></path>
        </svg>
    </>
);


const MicButton: React.FC<MicButtonProps> = ({ isConnecting, isConnected, isListening, onClick }) => {
    const glowClass = isConnected 
      ? 'shadow-[0_0_25px_5px_rgba(0,168,232,0.5),_0_0_10px_0px_rgba(255,107,107,0.5)]'
      : 'shadow-[0_0_25px_5px_rgba(255,107,107,0.4)]';

    return (
        <button
            onClick={onClick}
            disabled={isConnecting}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none bg-black/30 backdrop-blur-sm ${glowClass}`}
            aria-label={isConnected ? "Stop session" : "Start session"}
        >
            <div className="absolute inset-0 rounded-full border border-white/20"></div>
            <div className="absolute inset-[-4px] rounded-full border border-white/20 opacity-50"></div>
            
            {isConnecting ? (
                <div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
                <MicIcon className={`w-10 h-10 transition-transform duration-300 ${isListening ? 'scale-110' : 'scale-100'}`} />
            )}
        </button>
    );
};

export default MicButton;