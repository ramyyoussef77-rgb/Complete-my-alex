import React from 'react';

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const REACTIONS = ['👍', '❤️', '😂', '💡'];

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
    return (
        <div className="absolute z-10 -top-10 left-0 flex items-center gap-1 p-1 bg-white dark:bg-base-dark-100 rounded-full shadow-lg border border-base-300 dark:border-base-dark-300">
            {REACTIONS.map(emoji => (
                <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className="p-1 text-lg rounded-full hover:bg-base-200 dark:hover:bg-base-dark-200 transition-transform hover:scale-125"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default ReactionPicker;
