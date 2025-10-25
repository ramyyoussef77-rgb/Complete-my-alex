import React from 'react';

interface LocationPermissionBannerProps {
  onDismiss: () => void;
}

const LocationPermissionBanner: React.FC<LocationPermissionBannerProps> = ({ onDismiss }) => {
  return (
    <div className="bg-secondary/10 text-secondary p-3 flex items-center justify-between text-sm border-b border-secondary/20 z-10">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>
          Location access is denied. Enable it in your browser settings for better local recommendations and results.
        </span>
      </div>
      <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/10" aria-label="Dismiss">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default LocationPermissionBanner;