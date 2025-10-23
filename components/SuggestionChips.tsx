
import React from 'react';

interface SuggestionChipsProps {
    suggestions: string[];
    onChipClick: (text: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onChipClick }) => {
    return (
        <div className="px-4 pt-2 pb-1 overflow-x-auto">
            <div className="flex items-center gap-2 pb-2">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onChipClick(suggestion)}
                        className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-white/10 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SuggestionChips;
