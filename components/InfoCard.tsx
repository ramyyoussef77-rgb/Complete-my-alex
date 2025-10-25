
import React, { useState, useEffect, useRef } from 'react';

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  isLoading: boolean;
  error: string | null;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  contentClassName?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, isLoading, error, children, onClick, className, contentClassName }) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const prevIsLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && !error) {
        setIsHighlighted(true);
        const timer = setTimeout(() => setIsHighlighted(false), 1200);
        return () => clearTimeout(timer);
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, error]);

  return (
    <div 
      className={`glassmorphism-enhanced p-4 rounded-xl shadow-lg flex flex-col group relative overflow-hidden ltr:border-r-4 rtl:border-l-4 border-transparent ltr:hover:border-r-secondary rtl:hover:border-l-secondary tilt-card ${onClick ? 'cursor-pointer' : ''} ${isHighlighted ? 'animate-highlight' : ''} ${className}`}
      onClick={onClick}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="relative z-10 flex items-center text-base-content-dark/70 mb-2 transition-colors duration-300" style={{ transform: 'translateZ(20px)' }}>
        <span className="transition-transform duration-300 group-hover:scale-110">{icon}</span>
        <h3 className="ml-2 font-semibold text-subtitle">{title}</h3>
      </div>
      <div className={`relative z-10 flex-1 flex items-center justify-center text-center text-base-content-dark ${contentClassName || ''}`} style={{ transform: 'translateZ(10px)' }}>
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-current/50 border-t-secondary rounded-full animate-spin"></div>
        ) : error ? (
          <p className="text-accent text-sm">{error}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default React.memo(InfoCard);