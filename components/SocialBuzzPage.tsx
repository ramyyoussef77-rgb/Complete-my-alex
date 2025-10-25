
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SocialPost } from '../types';
import SocialBuzzCard from './SocialBuzzCard';
import { useTranslations } from '../hooks/useTranslations';
// FIX: Changed import to named import as Header is now a named export
import { Header } from './Header';
import { useApp } from '../hooks/useApp';
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import { SkeletonCard } from './SkeletonLoader';
import DailyBuzzSummaryCard from './DailyBuzzSummaryCard';

interface SocialBuzzPageProps {
  openNav: () => void;
  onNavigate: (page: 'home' | 'assistant' | 'socialBuzz' | 'history' | 'marketplace' | 'chatRooms' | 'settings' | 'events' | 'localServices') => void;
}

const POSTS_PER_PAGE = 12;

const SocialBuzzPage: React.FC<SocialBuzzPageProps> = ({ openNav }) => {
  const { contentVersion } = useApp();
  const t = useTranslations();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mainRef = useRef<HTMLElement>(null);
  const observer = useRef<IntersectionObserver>();

  const { translatedData: translatedPosts } = useAutoTranslator(posts);

  const fetchSocialBuzz = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsFetchingMore(true);
    setError(null);
    
    try {
      if (!process.env.API_KEY) throw new Error("API key is not configured.");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Find recent, family-friendly social media buzz about Alexandria, Egypt.
        Search for what people are saying online on public platforms like X (Twitter) or public Facebook groups. Prioritize posts that include images and have positive or neutral sentiment. Look for posts with hashtags #Alexandria or #الإسكندرية.
        Return page ${pageNum} of the ${POSTS_PER_PAGE} most relevant and interesting posts. Avoid returning duplicate posts from previous pages.
        Ensure the content is suitable for a general audience.
        Your response MUST be ONLY a valid JSON array of objects. Do not include any text, explanations, or markdown code blocks.
        Each object in the array must have: "author"(string), "content"(string), "url"(string), "platform"(string), "imageUrl"(string URL or empty string), "sentiment"(one of 'Positive', 'Neutral', 'Negative'), and "tags"(string array of 1-3 keywords).
        If no more posts are found, return an empty JSON array: [].
      `;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
      const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
      
      const newPosts: SocialPost[] = JSON.parse(sanitizedText);
      
      setHasMore(newPosts.length === POSTS_PER_PAGE);
      setPosts(prev => isRefresh ? newPosts : [...prev, ...newPosts]);
      
      if (isRefresh) {
        const tags = new Set(newPosts.flatMap(p => p.tags || []));
        setAllTags(Array.from(tags).slice(0, 10)); // Limit to 10 most common tags for UI
      } else {
        setAllTags(prev => {
          const newTags = new Set([...prev, ...newPosts.flatMap(p => p.tags || [])]);
          return Array.from(newTags).slice(0, 10);
        });
      }

    } catch (e) {
      console.error("Failed to fetch social buzz:", e);
      setError(t.error_social_buzz);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [t.error_social_buzz]);

  useEffect(() => {
    fetchSocialBuzz(1, true); // Initial fetch
  }, [fetchSocialBuzz, contentVersion]);
  
  const lastPostElementRef = useCallback((node: any) => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchSocialBuzz(nextPage, false);
          return nextPage;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore, fetchSocialBuzz]);
  
  const filteredPosts = useMemo(() => {
      if (!activeTag) return translatedPosts;
      return (translatedPosts || []).filter(post => post.tags?.includes(activeTag));
  }, [activeTag, translatedPosts]);

  const handleRefresh = () => {
      setPosts([]);
      setPage(1);
      setActiveTag(null);
      fetchSocialBuzz(1, true);
  };

  return (
    <div className="relative flex-1 w-full bg-base-dark-100 text-base-content-dark p-4 pt-20 flex flex-col">
       <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="aurora-blob w-[600px] h-[500px] bg-primary/30" style={{'--start-x': '-20%', '--start-y': '10%', '--end-x': '40%', '--end-y': '80%'}}></div>
          <div className="aurora-blob w-[500px] h-[500px] bg-secondary/20" style={{'--start-x': '80%', '--start-y': '20%', '--end-x': '20%', '--end-y': '90%', animationDuration: '30s'}}></div>
      </div>

      <Header openNav={openNav} />

      <main ref={mainRef} className="flex-1 overflow-y-auto z-10 pr-2">
         <div className="sticky top-0 z-20 bg-base-dark-100/80 backdrop-blur-sm -mx-4 px-4 py-3 mb-4 space-y-3">
            <DailyBuzzSummaryCard />
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button onClick={() => setActiveTag(null)} className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors flex-shrink-0 ${!activeTag ? 'bg-secondary text-base-dark-100' : 'bg-base-dark-200'}`}>{t.all_posts}</button>
                {allTags.map(tag => (
                    <button key={tag} onClick={() => setActiveTag(tag)} className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors flex-shrink-0 ${activeTag === tag ? 'bg-secondary text-base-dark-100' : 'bg-base-dark-200'}`}>#{tag}</button>
                ))}
                <button onClick={handleRefresh} className="px-3 py-1 text-sm rounded-full font-semibold transition-colors flex-shrink-0 bg-base-dark-200 flex items-center gap-1.5 ml-auto">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5" /></svg>
                   {t.refresh}
                </button>
            </div>
         </div>
         
         {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="h-48" />)}
            </div>
         ) : error ? (
            <div className="text-center py-10">
                <p className="text-accent">{error}</p>
                <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-secondary text-base-dark-100 rounded-md">{t.retry}</button>
            </div>
         ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ perspective: '1000px' }}>
               {filteredPosts.map((post, index) => (
                  <div ref={filteredPosts.length === index + 1 ? lastPostElementRef : null} key={`${post.url}-${index}`} className="animate-fade-in-up" style={{ animationDelay: `${(index % POSTS_PER_PAGE) * 50}ms` }}>
                    <SocialBuzzCard post={post} onTagClick={setActiveTag} />
                  </div>
               ))}
            </div>
         ) : (
             <div className="text-center py-10 text-base-content-dark/70">
                <p className="text-xl font-semibold">{t.no_posts_found_friendly}</p>
                <p>{t.no_posts_found_suggestion}</p>
            </div>
         )}

         {isFetchingMore && (
            <div className="text-center py-4">{t.loading_more}</div>
         )}
         {!hasMore && posts.length > 0 && (
            <div className="text-center py-4 text-base-content-dark/50">{t.no_more_posts}</div>
         )}
      </main>
    </div>
  );
};

export default SocialBuzzPage;
