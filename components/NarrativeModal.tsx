import React, { useEffect } from 'react';
import { HistoricalPlace } from '../types';

interface NarrativeModalProps {
    place: HistoricalPlace | null;
    onClose: () => void;
}

const NarrativeModal: React.FC<NarrativeModalProps> = ({ place, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!place) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 animate-page-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-parchment dark:bg-base-dark-200 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-base-300 dark:border-base-dark-300">
                    <h2 className="text-2xl font-bold text-base-content dark:text-base-content-dark">{place.name}</h2>
                    <p className="text-secondary font-semibold">{place.era}</p>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    <p className="text-lg leading-relaxed italic text-base-content/90 dark:text-base-content-dark/90">
                        "{place.narrative || 'No narrative available.'}"
                    </p>
                </div>
                <div className="p-4 border-t border-base-300 dark:border-base-dark-300 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NarrativeModal;
