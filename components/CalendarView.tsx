
import React, { useState, useMemo } from 'react';
import { LocalEvent } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface CalendarViewProps {
    events: LocalEvent[];
    onDateSelect: (date: Date | null) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onDateSelect }) => {
    const t = useTranslations();
    const [currentDate, setCurrentDate] = useState(new Date());

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => i + 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const eventsByDate = useMemo(() => {
        const map = new Map<string, LocalEvent[]>();
        events.forEach(event => {
            if (event.startDate) {
                const dateStr = new Date(event.startDate).toDateString();
                if (!map.has(dateStr)) map.set(dateStr, []);
                map.get(dateStr)?.push(event);
            }
        });
        return map;
    }, [events]);
    
    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const daysOfWeek = t.language === 'ar' 
        ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-base-dark-200 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-base-dark-300">&lt;</button>
                <h2 className="text-xl font-bold">
                    {currentDate.toLocaleString(t.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-base-dark-300">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-base-content-dark/60">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {daysInMonth.map(day => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dateStr = date.toDateString();
                    const hasEvents = eventsByDate.has(dateStr);
                    return (
                        <button 
                            key={day} 
                            onClick={() => onDateSelect(date)}
                            className="relative w-full aspect-square flex flex-col items-center justify-center text-sm rounded-md hover:bg-base-dark-300 transition-colors"
                        >
                            <span>{day}</span>
                            {hasEvents && <div className="absolute bottom-1 w-1.5 h-1.5 bg-secondary rounded-full"></div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;