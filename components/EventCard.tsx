import React from 'react';
import { LocalEvent } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface EventCardProps {
  event: LocalEvent;
  onAddToCalendar: () => void;
  onAnalyze: () => void;
}

const CalendarIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const AnalyzeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>;

const EventCard: React.FC<EventCardProps> = ({ event, onAddToCalendar, onAnalyze }) => {
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
    <div className="bg-base-200 dark:bg-base-dark-200 rounded-xl overflow-hidden h-full flex flex-col shadow-lg dark:shadow-none transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1">
      <div className="relative">
        <img src={event.imageUrl || 'https://via.placeholder.com/400x200'} alt={event.name} className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        {category && (
          <p className="absolute top-2 left-2 text-xs font-bold text-white bg-accent px-2 py-1 rounded-full shadow-md">{category}</p>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm font-semibold text-primary dark:text-secondary">{event.date}</p>
        <h3 className="text-lg font-semibold text-base-content dark:text-base-content-dark truncate mt-1">{event.name}</h3>
        <p className="text-xs text-base-content/70 dark:text-base-content-dark/70">{event.location}</p>
        <p className="text-base-content/80 dark:text-base-content-dark/80 text-sm line-clamp-2 flex-1 mt-2">{event.description}</p>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-base-300 dark:border-base-dark-300">
          <button onClick={(e) => handleButtonClick(e, onAddToCalendar)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-base-300 dark:bg-base-dark-300 text-xs font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <CalendarIcon /> {t.add_to_calendar}
          </button>
          <button onClick={(e) => handleButtonClick(e, onAnalyze)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-secondary/20 text-secondary text-xs font-semibold rounded-md hover:bg-secondary/30 transition-colors">
            <AnalyzeIcon /> {t.analyze_event}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EventCard);
