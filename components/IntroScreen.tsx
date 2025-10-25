
import React, { useEffect } from 'react';
import LighthouseIconAnimated from './LighthouseIconAnimated';
import { useTranslations } from '../hooks/useTranslations';

interface IntroScreenProps {
  onAnimationComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onAnimationComplete }) => {
  const t = useTranslations();

  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 3500); // Show intro for 3.5 seconds
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-primary to-base-dark-100 text-base-content-dark animate-page-fade-in">
      <div className="text-center animate-fade-in-up" style={{animationDelay: '0.5s'}}>
        <LighthouseIconAnimated className="w-64 h-64" isAnimatedLightSweep={true} isFloating={true} />
        <h1 className="text-display tracking-wider text-white mt-8">{t.home_title_en}</h1>
        <h2 className="text-h1 font-light text-secondary">{t.home_title_ar}</h2>
      </div>
      <div className="absolute bottom-10">
        <div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default IntroScreen;
