
import React from 'react';
import { LocalEvent } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface EventCardProps {
  event: LocalEvent;
  onAddToCalendar: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const CalendarIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const AnalyzeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>;

const EventCard: React.FC<EventCardProps> = ({ event, onAddToCalendar, onAnalyze, isAnalyzing }) => {
  const t = useTranslations();
  // FIX: Safely construct translation key to avoid implicit conversion errors at runtime.
  const category = event.category ? t[`cat_${event.category.toLowerCase()}` as keyof typeof t] || event.category : event.category;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };
  
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    e.stopPropagation();
    action();
  }

  return (
    <div className="glassmorphism-enhanced tilt-card rounded-xl overflow-hidden h-full flex flex-col shadow-lg transition-all duration-300 group">
      <div className="relative">
        <img src={event.imageUrl || 'https://via.placeholder.com/400x200'} alt={event.name} className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        {category && (
          <p className="absolute top-2 left-2 text-caption font-bold text-base-content bg-accent px-2 py-1 rounded-full shadow-md">{category}</p>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-body font-semibold text-primary">{event.date}</p>
        <h3 className="text-subtitle truncate mt-1">{event.name}</h3>
        <p className="text-caption text-base-content-dark/70">{event.location}</p>
        <p className="text-body text-base-content-dark/80 line-clamp-2 flex-1 mt-2">{event.description}</p>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-base-dark-300">
          <button onClick={(e) => handleButtonClick(e, onAddToCalendar)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-base-dark-300 text-caption font-semibold rounded-md hover:bg-gray-600 transition-colors">
            <CalendarIcon /> {t.add_to_calendar}
          </button>
          <button onClick={(e) => handleButtonClick(e, onAnalyze)} disabled={isAnalyzing} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-secondary/20 text-secondary text-caption font-semibold rounded-md hover:bg-secondary/30 transition-colors disabled:opacity-50">
             {isAnalyzing ? <div className="w-4 h-4 border-2 border-current/50 border-t-secondary rounded-full animate-spin"></div> : <AnalyzeIcon />}
             {isAnalyzing ? t.analyzing : t.analyze_event}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EventCard);