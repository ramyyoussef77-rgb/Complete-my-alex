import React, { useState, useEffect } from 'react';

const StatusBar: React.FC = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const SignalIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <rect x="1" y="10" width="2" height="4" rx="1" opacity="0.8"/>
        <rect x="4" y="7" width="2" height="7" rx="1" opacity="0.8"/>
        <rect x="7" y="4" width="2" height="10" rx="1" opacity="0.8"/>
        <rect x="10" y="1" width="2" height="13" rx="1" opacity="0.8"/>
    </svg>
  );


  return (
    <div className="absolute top-0 left-0 right-0 h-10 px-4 flex justify-between items-center text-base-content-dark text-sm font-medium z-10">
      <span>{time}</span>
      <div className="flex items-center space-x-1.5">
        <SignalIcon />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M1.393 9.393a15 15 0 0121.214 0" /></svg>
        <div className="w-6 h-3 border border-base-content-dark/80 rounded-sm flex items-center p-0.5">
          <div className="w-full h-full bg-base-content-dark/80 rounded-xs"></div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;