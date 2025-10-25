
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HistoricalPlace } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface HistoryCardProps {
  place: HistoricalPlace;
  onReadMore: () => void;
  onPlayAudio: () => void;
  audioState: 'loading' | 'playing' | null;
}

const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
};

const HistoryCard: React.FC<HistoryCardProps> = ({ place, onReadMore, onPlayAudio, audioState }) => {
  const t = useTranslations();
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    let percentage = (y / rect.height) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    setSliderPos(percentage);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  const handleMouseMove = useCallback((e: MouseEvent) => handleMove(e.clientX, e.clientY), [handleMove]);
  const handleTouchMove = useCallback((e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY), [handleMove]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleShowOnMap = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    createRipple(e);
    if (place.coordinates) {
      window.open(`https://www.google.com/maps?q=${place.coordinates.lat},${place.coordinates.lng}`, '_blank');
    }
  };

  const handleReadMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      createRipple(e);
      onReadMore();
  }

  const handlePlayAudioClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      createRipple(e);
      onPlayAudio();
  }

  const AudioButtonIcon = () => {
    if (audioState === 'loading') return <div className="w-4 h-4 border-2 border-current/50 border-t-secondary rounded-full animate-spin"></div>;
    if (audioState === 'playing') return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
  };

  return (
    <div className="relative rounded-xl shadow-lg overflow-hidden group aspect-[3/4] tilt-card" style={{ transformStyle: 'preserve-3d' }}>
      <div ref={containerRef} className="history-slider-container">
        {/* Modern Image (Bottom) */}
        {!isImageLoaded && <div className="absolute inset-0 bg-base-300 dark:bg-base-dark-300 animate-pulse"></div>}
        <img src={place.modernImageUrl} alt={place.name} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setIsImageLoaded(true)} />

        {/* Ancient Image (Top, clipped) */}
        <img
          src={place.ancientImageUrl} alt={`Ancient view of ${place.name}`}
          className="history-slider-image-top"
          style={{ clipPath: `inset(0 0 ${100 - sliderPos}% 0)` }}
        />
        <div
          className="history-slider-track"
          style={{ top: `${sliderPos}%` }}
        ></div>
        <div
          className="history-slider-handle"
          style={{ top: `${sliderPos}%` }}
          onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
        ></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"></div>

      <div className="absolute bottom-0 left-0 right-0 p-4 h-full flex flex-col justify-end text-white z-20">
        <h3 className="text-title font-serif-special mb-1 drop-shadow-md">{place.name}</h3>
        <p className="text-sm text-secondary mb-2 font-bold drop-shadow-sm">{place.era}</p>
        <p className="text-body text-white/90 line-clamp-2">{place.description}</p>
        <div className="flex items-center gap-2 mt-4">
          <button onClick={handleReadMoreClick} className="ripple-container px-3 py-1 bg-base-content-dark/20 text-base-content-dark text-caption font-semibold rounded-full backdrop-blur-sm border border-base-content-dark/20 hover:bg-base-content-dark/30 transition-colors">{t.read_more}</button>
          {place.coordinates && <button onClick={handleShowOnMap} className="ripple-container px-3 py-1 bg-base-content-dark/20 text-base-content-dark text-caption font-semibold rounded-full backdrop-blur-sm border border-base-content-dark/20 hover:bg-base-content-dark/30 transition-colors">{t.show_on_map}</button>}
          {place.narrative && <button onClick={handlePlayAudioClick} className="ripple-container p-2 w-8 h-8 flex items-center justify-center bg-base-content-dark/20 text-base-content-dark text-xs font-semibold rounded-full backdrop-blur-sm border border-base-content-dark/20 hover:bg-base-content-dark/30 transition-colors"><AudioButtonIcon /></button>}
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;