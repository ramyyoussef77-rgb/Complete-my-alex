
import React from 'react';
import { LocalService } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ServiceCardProps {
    service: LocalService;
    isSelected: boolean;
    onSelect: () => void;
}

const StarRating: React.FC<{ rating?: number }> = ({ rating = 0 }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const ServiceCard: React.FC<ServiceCardProps> = ({ service, isSelected, onSelect }) => {
    const t = useTranslations();
    const language = useTranslations().language;

    return (
        <button
            onClick={onSelect}
            className={`block w-full text-left p-3 rounded-lg shadow-md transition-all duration-200 ${isSelected ? 'bg-primary/20 dark:bg-secondary/20 ring-2 ring-secondary' : 'bg-base-200 dark:bg-base-dark-200 hover:bg-base-300 dark:hover:bg-base-dark-300'}`}
        >
            <h3 className="font-bold text-base-content dark:text-base-content-dark truncate">{service.name}</h3>
            <p className="text-sm text-secondary font-semibold">{t[service.category.toLowerCase() as keyof typeof t] || service.category}</p>
            
            <div className="flex items-center justify-between text-xs text-base-content/80 dark:text-base-content-dark/80 mt-2">
                {service.starRating != null && (
                    <div className="flex items-center">
                        <StarRating rating={service.starRating} />
                        <span className="ml-1 font-semibold">{service.starRating.toFixed(1)}</span>
                    </div>
                )}
                {service.priceLevel && <span className="font-bold">{service.priceLevel}</span>}
            </div>

            <div className={`flex items-center mt-2 ${language === 'ar' ? 'justify-end' : 'justify-between'}`}>
                {service.isOpenNow != null &&
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-white text-xs ${service.isOpenNow ? 'bg-green-500' : 'bg-red-500'}`}>
                        {service.isOpenNow ? t.open_now : 'Closed'}
                    </span>
                }
                {service.distance && <span className="font-semibold text-base-content/80 dark:text-base-content-dark/80 text-xs">{service.distance}</span>}
            </div>
        </button>
    );
};

export default React.memo(ServiceCard);
