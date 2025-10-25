import React from 'react';
import { ConversationTurn } from '../types';

const WebIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.527-1.973c.473-.128.99-.054 1.453.123a6.008 6.008 0 01-1.348 5.423 2.008 2.008 0 01-1.453.123A1.5 1.5 0 0114 12.5v-.5a2 2 0 00-4 0 2 2 0 01-1.527 1.973 6.012 6.012 0 01-1.912 2.706C6.512 14.27 6.974 14 7.5 14A1.5 1.5 0 019 12.5V12a2 2 0 00-4 0 2 2 0 01-1.527-1.973 6.008 6.008 0 011.348-5.423z" clipRule="evenodd" /></svg>;
const MapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293A1 1 0 0016 6v10a1 1 0 00.293.707L20 20.414V7.586L17.707 5.293z" clipRule="evenodd" /></svg>;

const AssistantMessage: React.FC<{ turn: ConversationTurn }> = ({ turn }) => {

    if (turn.type === 'system') {
        return (
            <div className="text-center text-sm text-white/60">{turn.text}</div>
        );
    }

    if (turn.type === 'tool') {
        return (
            <div className="flex justify-center items-center my-2 text-sm text-primary/80">
                <div className="w-4 h-4 border-2 border-current/50 border-t-primary rounded-full animate-spin mr-2"></div>
                {turn.text}
            </div>
        );
    }
    
    const isUser = turn.type === 'user';

    return (
        <div className={`flex flex-col animate-slide-in-bottom ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-2xl p-3 max-w-[85%] ${isUser ? 'bg-primary/80' : 'bg-base-dark-200/80'} ${turn.isPartial ? 'opacity-70' : ''}`}>
                <p className="text-body whitespace-pre-wrap">{turn.text}</p>
            </div>
            {!isUser && turn.grounding && turn.grounding.length > 0 && !turn.isPartial && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {turn.grounding.map((chunk, i) => {
                        if (chunk.web) {
                            return <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs bg-black/30 text-white/70 px-2 py-1 rounded-full hover:bg-black/50"><WebIcon /> <span className="truncate max-w-48">{chunk.web.title}</span></a>
                        }
                        if (chunk.maps) {
                             return <a key={i} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs bg-black/30 text-white/70 px-2 py-1 rounded-full hover:bg-black/50"><MapIcon /> <span className="truncate max-w-48">{chunk.maps.title}</span></a>
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

export default AssistantMessage;