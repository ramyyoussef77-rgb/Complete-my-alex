
import React from 'react';
import { SocialPost } from '../types';

const PlatformIcon: React.FC<{ platform: string }> = ({ platform }) => {
    if (platform?.toLowerCase().includes('x') || platform?.toLowerCase().includes('twitter')) {
        return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9" /></svg>;
};

const SentimentIcon: React.FC<{ sentiment?: 'Positive' | 'Neutral' | 'Negative' }> = ({ sentiment }) => {
    switch (sentiment) {
        case 'Positive': return <span title="Positive" className="text-lg">😊</span>;
        case 'Negative': return <span title="Negative" className="text-lg">😠</span>;
        case 'Neutral': return <span title="Neutral" className="text-lg">😐</span>;
        default: return null;
    }
}

const SocialBuzzCard: React.FC<{ post: SocialPost, onTagClick: (tag: string) => void }> = ({ post, onTagClick }) => {
    return (
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="glassmorphism-enhanced tilt-card block rounded-xl shadow-lg overflow-hidden group transition-all duration-300">
            {post.imageUrl && (
                <div className="overflow-hidden h-40">
                    <img src={post.imageUrl} alt="Post image" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
            )}
            <div className="p-4 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center flex-1 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mr-3 text-base-content font-bold shrink-0">
                            {post.author ? post.author.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-subtitle text-base-content-dark truncate">{post.author}</p>
                            <div className="flex items-center text-base-content-dark/70 text-xs">
                                <PlatformIcon platform={post.platform} />
                                <span className="ml-1.5">{post.platform}</span>
                            </div>
                        </div>
                    </div>
                    <SentimentIcon sentiment={post.sentiment} />
                </div>
                <p className="text-body text-base-content-dark/90 line-clamp-4 flex-1 my-2">{post.content}</p>
                {post.tags && post.tags.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-base-content-dark/10">
                        {post.tags.map(tag => (
                            <button 
                                key={tag} 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick(tag); }}
                                className="px-2 py-1 bg-primary/20 text-secondary text-caption font-semibold rounded-full hover:bg-primary/40 transition-colors"
                            >
                                #{tag}
                            </button>
                        ))}
                     </div>
                )}
            </div>
        </a>
    );
};

export default React.memo(SocialBuzzCard);