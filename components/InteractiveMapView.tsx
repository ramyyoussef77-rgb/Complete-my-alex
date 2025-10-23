
import React, { useMemo } from 'react';
import { LocalService } from '../types';

interface InteractiveMapViewProps {
    services: LocalService[];
    selectedServiceId: string | null;
    onSelectService: (id: string) => void;
}

const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({ services, selectedServiceId, onSelectService }) => {
    const PADDING = 10;

    const projection = useMemo(() => {
        const validServices = services.filter(s => s.coordinates?.lat && s.coordinates?.lng);
        if (validServices.length === 0) return null;

        const lats = validServices.map(s => s.coordinates!.lat);
        const lngs = validServices.map(s => s.coordinates!.lng);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        const latRange = maxLat - minLat || 1;
        const lngRange = maxLng - minLng || 1;
        const maxRange = Math.max(latRange, lngRange);

        const project = (lat: number, lng: number) => {
            const x = PADDING + (((lng - minLng) / maxRange) * (100 - 2 * PADDING));
            const y = PADDING + (((maxLat - lat) / maxRange) * (100 - 2 * PADDING));
            return { x, y };
        };

        return { project };
    }, [services]);

    if (!projection) {
        return <div className="w-full h-full bg-base-300 dark:bg-base-dark-300 rounded-lg flex items-center justify-center text-sm text-base-content/50 dark:text-base-content-dark/50">Map View</div>;
    }

    return (
        <div className="w-full h-full bg-base-300 dark:bg-base-dark-300 rounded-lg overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0 25 H100 M0 50 H100 M0 75 H100 M25 0 V100 M50 0 V100 M75 0 V100" strokeWidth="0.5" className="stroke-current opacity-10" />
                
                {services.map(service => {
                    if (!service.coordinates) return null;
                    const { x, y } = projection.project(service.coordinates.lat, service.coordinates.lng);
                    const isSelected = service.id === selectedServiceId;

                    return (
                        <g key={service.id} onClick={() => onSelectService(service.id)} className="cursor-pointer group">
                            <circle cx={x} cy={y} r={isSelected ? 5 : 3} className={`transition-all duration-200 ${isSelected ? 'fill-secondary' : 'fill-primary group-hover:fill-secondary'}`} stroke="white" strokeWidth="0.5" />
                            {isSelected && <circle cx={x} cy={y} r="6" className="fill-secondary/30 animate-pulse" />}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default InteractiveMapView;
