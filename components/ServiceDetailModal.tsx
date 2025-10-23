
import React, { useState, useEffect } from 'react';
import { LocalService } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ServiceDetailModalProps {
    service: LocalService | null;
    onClose: () => void;
}

const PhotoCarousel: React.FC<{ photos: string[]; name: string }> = ({ photos, name }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const next = () => setCurrentIndex(i => (i + 1) % photos.length);
    const prev = () => setCurrentIndex(i => (i - 1 + photos.length) % photos.length);
    
    if(!photos || photos.length === 0) return <div className="w-full h-48 bg-base-300 dark:bg-base-dark-300 rounded-t-lg flex items-center justify-center text-sm">No Photos Available</div>;

    return (
        <div className="relative w-full h-48 bg-base-300 dark:bg-base-dark-300 rounded-t-lg">
            <img src={photos[currentIndex]} alt={`${name} photo ${currentIndex + 1}`} className="w-full h-full object-cover" />
            {photos.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 leading-none w-6 h-6 flex items-center justify-center">❮</button>
                    <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 leading-none w-6 h-6 flex items-center justify-center">❯</button>
                </>
            )}
        </div>
    );
};

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, onClose }) => {
    const t = useTranslations();

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!service) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-page-fade-in" onClick={onClose}>
            <div className="bg-base-200 dark:bg-base-dark-200 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <PhotoCarousel photos={service.photoUrls || []} name={service.name} />
                <div className="flex-1 p-4 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-base-content dark:text-base-content-dark">{service.name}</h2>
                    <p className="text-secondary font-semibold">{t[service.category.toLowerCase() as keyof typeof t] || service.category}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
                         {service.starRating != null && <span className="font-semibold">⭐ {service.starRating.toFixed(1)} {t.rating}</span>}
                         {service.priceLevel && <span>{service.priceLevel}</span>}
                         {service.isOpenNow != null && <span className={`font-semibold px-2 py-0.5 rounded-full text-white text-xs ${service.isOpenNow ? 'bg-green-500' : 'bg-red-500'}`}>{service.isOpenNow ? t.open_now : 'Closed'}</span>}
                    </div>
                    
                    <div className="mt-4 space-y-2 text-sm text-base-content/90 dark:text-base-content-dark/90">
                        <p>📍 {service.address}</p>
                        {service.phone && <a href={`tel:${service.phone}`} className="hover:underline">📞 {service.phone}</a>}
                    </div>

                    {service.reviewSummary && (
                        <div className="mt-4">
                            <h3 className="font-bold text-base-content dark:text-base-content-dark">{t.reviews}</h3>
                            <p className="text-sm italic p-2 bg-base-100 dark:bg-base-dark-100 rounded-md mt-1">"{service.reviewSummary}"</p>
                        </div>
                    )}
                    
                    {service.openingHours && service.openingHours.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-bold text-base-content dark:text-base-content-dark">{t.opening_hours}</h3>
                            <ul className="text-sm space-y-1 mt-1">
                                {service.openingHours.map(oh => <li key={oh.day} className="flex justify-between"><span>{oh.day}</span><span className="font-mono">{oh.hours}</span></li>)}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-base-300 dark:border-base-dark-300 flex gap-4">
                    <a href={service.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-primary text-white font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">{t.view_on_map}</a>
                    <button onClick={onClose} className="flex-1 text-center bg-base-300 dark:bg-base-dark-300 font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailModal;
