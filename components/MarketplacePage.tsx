
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MarketplaceItem } from '../types';
import MarketplaceCard from './MarketplaceCard';
import ItemDetailModal from './ItemDetailModal';
import FindSimilarModal from './FindSimilarModal';
import { useTranslations } from '../hooks/useTranslations';
import { useApp } from '../hooks/useApp';
import { getMarketplaceItems, addMarketplaceItem, uploadImage, deleteMarketplaceItem, updateMarketplaceItem } from '../services/firebaseService';
// FIX: Changed import to named import as Header is now a named export
import { Header } from './Header';
import { GoogleGenAI, Modality } from '@google/genai';
import { SkeletonImageCard } from './SkeletonLoader';

type Mode = 'buy' | 'sell' | 'myListings';
type SortBy = 'newest' | 'priceLowHigh' | 'priceHighLow';
const CATEGORIES = ['Electronics', 'Furniture', 'Antiques', 'Clothing', 'Books', 'Other'];
const ITEMS_PER_PAGE = 10;

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const MarketplacePage: React.FC<{ openNav: () => void }> = ({ openNav }) => {
  const t = useTranslations();
  const { user } = useApp();
  const [mode, setMode] = useState<Mode>('buy');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filtering & Sorting State
  const [filters, setFilters] = useState({ category: 'all', search: '' });
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  // Modals & Item State
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [itemToFindSimilar, setItemToFindSimilar] = useState<MarketplaceItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<MarketplaceItem | null>(null);

  // Sell Form State
  const [formState, setFormState] = useState({ title: '', price: '', description: '', phone: '', category: 'Other' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const observer = useRef<IntersectionObserver>();

  const fetchItems = useCallback(async (startAfter: number | null, isRefresh: boolean = false) => {
    if (isRefresh) setIsLoading(true); else setIsFetchingMore(true);
    setError(null);

    try {
        const { items: newItems, lastVisible: newLastVisible } = await getMarketplaceItems(ITEMS_PER_PAGE, startAfter || undefined);
        setHasMore(newItems.length === ITEMS_PER_PAGE);
        setLastVisible(newLastVisible);
        setItems(prev => isRefresh ? newItems : [...prev, ...newItems]);
    } catch (e) {
        console.error("Failed to fetch marketplace items:", e);
        setError(t.error_marketplace_items);
    } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
    }
  }, [t.error_marketplace_items]);

  useEffect(() => { fetchItems(null, true); }, [fetchItems]);
  
  const lastItemElementRef = useCallback(node => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchItems(lastVisible);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore, fetchItems, lastVisible]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'sell' && !itemToEdit) resetForm();
  };
  
  const filteredAndSortedItems = useMemo(() => {
    let processed = [...items];
    if (filters.category !== 'all') processed = processed.filter(item => item.category === filters.category);
    if (filters.search) processed = processed.filter(item => item.title.toLowerCase().includes(filters.search.toLowerCase()) || item.description.toLowerCase().includes(filters.search.toLowerCase()));

    const parsePrice = (priceStr: string) => parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
    if (sortBy === 'priceLowHigh') processed.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    if (sortBy === 'priceHighLow') processed.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    if (sortBy === 'newest') processed.sort((a, b) => b.postedDate - a.postedDate);

    return processed;
  }, [items, filters, sortBy]);

  const myItems = useMemo(() => items.filter(item => item.userId === user?.uid).sort((a, b) => b.postedDate - a.postedDate), [items, user]);
  
  const resetForm = () => {
    setFormState({ title: '', price: '', description: '', phone: '', category: 'Other' });
    setImageFile(null); setImagePreview(null); setFormError(''); setItemToEdit(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };
  
  const handleImageFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };
  
  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    setIsAnalyzing(true); setFormError('');
    try {
        const base64Data = await fileToBase64(imageFile);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const imagePart = { inlineData: { mimeType: imageFile.type, data: base64Data } };
        const textPart = { text: `Analyze this item for sale. Provide a title, description (2-3 sentences), plausible price in EGP, category (one of ${CATEGORIES.join(', ')}), and 3-4 relevant tags. Respond with a valid JSON object: {"title", "description", "price", "category", "tags":[]}.` };
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] } });
        const { title, description, price, category, tags } = JSON.parse(response.text.replace(/^```json\s*|```$/g, ''));
        setFormState(s => ({...s, title, price, description, category}));
    } catch (e) {
        setFormError("AI analysis failed. Please fill details manually.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSuggestPrice = async () => {
    if (!formState.title) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const prompt = `Based on the item title "${formState.title}", what's a competitive price range in EGP in Alexandria, Egypt? Respond with a JSON object: {"suggestedPrice": "EGP X - EGP Y"}`;
      const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
      const { suggestedPrice } = JSON.parse(response.text.replace(/^```json\s*|```$/g, ''));
      setFormState(s => ({...s, price: suggestedPrice}));
    } catch (e) {
      setFormError("Failed to suggest a price.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.price || !formState.description || (!imageFile && !itemToEdit)) {
      setFormError(t.error_all_fields_required); return;
    }
    setIsSubmitting(true); setFormError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const modPrompt = `Is this marketplace listing appropriate? Title: "${formState.title}", Desc: "${formState.description}". Respond ONLY "safe" or "unsafe".`;
      const modResult = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: modPrompt});
      if (modResult.text.trim().toLowerCase() !== 'safe') {
        setFormError(t.moderation_failed);
        setIsSubmitting(false);
        return;
      }
      
      let imageUrl = itemToEdit?.imageUrl;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const itemData: Omit<MarketplaceItem, 'id'> = {
        ...formState,
        imageUrl: imageUrl!,
        postedDate: itemToEdit?.postedDate || Date.now(),
        userId: user!.uid,
        sellerName: user!.name,
        sellerAvatar: user!.avatar,
        isLocal: true,
      };

      if (itemToEdit) {
        const updated = await updateMarketplaceItem(itemToEdit.id, itemData);
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const newItem = await addMarketplaceItem(itemData);
        setItems(prev => [newItem, ...prev]);
      }

      resetForm();
      setMode('myListings');
    } catch (err) {
      setFormError("Failed to post item.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (item: MarketplaceItem) => {
    setItemToEdit(item);
    setFormState({ title: item.title, price: item.price, description: item.description, phone: item.phone || '', category: item.category || 'Other' });
    setImagePreview(item.imageUrl);
    setMode('sell');
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm(t.confirm_delete)) {
      await deleteMarketplaceItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  return (
    <>
      <ItemDetailModal item={selectedItem} allItems={items} onFindSimilar={setItemToFindSimilar} onClose={() => setSelectedItem(null)} />
      <FindSimilarModal item={itemToFindSimilar} allItems={items} onSelectItem={setSelectedItem} onClose={() => setItemToFindSimilar(null)} />
      
      <div className="relative flex-1 w-full bg-base-dark-100 text-base-content-dark p-4 pt-16 flex flex-col">
        <Header openNav={openNav} />
        <div className="flex items-center justify-center my-4">
          <div className="flex items-center bg-base-dark-200 p-1 rounded-full">
            <button onClick={() => handleModeChange('buy')} className={`px-4 py-1 rounded-full text-sm font-semibold ${mode === 'buy' ? 'bg-secondary text-base-dark-100' : ''}`}>{t.buy}</button>
            <button onClick={() => handleModeChange('sell')} className={`px-4 py-1 rounded-full text-sm font-semibold ${mode === 'sell' ? 'bg-secondary text-base-dark-100' : ''}`}>{t.sell}</button>
            <button onClick={() => handleModeChange('myListings')} className={`px-4 py-1 rounded-full text-sm font-semibold ${mode === 'myListings' ? 'bg-secondary text-base-dark-100' : ''}`}>{t.my_listings}</button>
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto pr-2">
          {mode === 'buy' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder={t.search_marketplace_placeholder} className="md:col-span-1 w-full px-4 py-2 border-transparent rounded-full bg-base-dark-200"/>
                <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2 border-transparent rounded-full bg-base-dark-200">
                  <option value="all">{t.category_all}</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{t[`cat_${c.toLowerCase()}` as keyof typeof t]}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="w-full px-4 py-2 border-transparent rounded-full bg-base-dark-200">
                  <option value="newest">{t.sort_newest}</option>
                  <option value="priceLowHigh">{t.sort_price_low_high}</option>
                  <option value="priceHighLow">{t.sort_price_high_low}</option>
                </select>
              </div>
              {isLoading ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{[...Array(10)].map((_, i) => <SkeletonImageCard key={i} />)}</div>
               : error ? <p className="text-center text-accent">{error}</p>
               : filteredAndSortedItems.length === 0 ? <p className="text-center">{t.no_listings_found}</p>
               : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" style={{ perspective: '1000px' }}>
                  {filteredAndSortedItems.map((item, index) => <div ref={items.length === index + 1 ? lastItemElementRef : null} key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${(index % ITEMS_PER_PAGE) * 50}ms` }}><MarketplaceCard item={item} onSelect={() => setSelectedItem(item)} /></div>)}
                </div>}
              {isFetchingMore && <div className="text-center py-4">{t.loading_more}</div>}
              {!hasMore && <div className="text-center py-4 text-white/50">{t.no_more_posts}</div>}
            </>
          )}

          {(mode === 'sell' || mode === 'myListings') && (
            mode === 'myListings' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" style={{ perspective: '1000px' }}>
                {myItems.map((i, index) => <div key={i.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}><MarketplaceCard item={i} onSelect={() => setSelectedItem(i)} onEdit={() => handleEdit(i)} onDelete={() => handleDelete(i.id)} isOwner={true} /></div>)}
                {myItems.length === 0 && <p className="col-span-full text-center">{t.no_listings_found}</p>}
              </div>
            ) : (
             <div className="max-w-xl mx-auto p-6 bg-base-dark-200 rounded-xl w-full">
                <h2 className="text-2xl font-bold text-center text-secondary mb-6">{itemToEdit ? 'Edit Listing' : t.create_listing}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div onDrop={(e) => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); setIsDragging(false); }} onDragOver={(e) => {e.preventDefault(); setIsDragging(true);}} onDragLeave={() => setIsDragging(false)} className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDragging ? 'border-secondary bg-secondary/10' : 'border-base-dark-300'}`}>
                        <input id="image-upload" type="file" accept="image/*" onChange={(e) => e.target.files && handleImageFile(e.target.files[0])} className="hidden" />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            {imagePreview ? <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg"/> : <p>{t.drag_drop_image}</p>}
                        </label>
                    </div>
                    {imageFile && <button type="button" onClick={handleAnalyzeImage} disabled={isAnalyzing} className="text-sm font-semibold text-secondary hover:underline disabled:opacity-50 flex items-center">{isAnalyzing ? <><div className="w-4 h-4 border-2 border-current/50 border-t-secondary rounded-full animate-spin mr-1"></div>Analyzing...</> : '✨ Auto-fill with AI'}</button>}
                    <input type="text" value={formState.title} onChange={e => setFormState(s=>({...s, title: e.target.value}))} placeholder={t.item_title} className="w-full px-3 py-2 border-transparent rounded-md bg-base-dark-100" />
                    <div className="flex items-center gap-2">
                        <input type="text" value={formState.price} onChange={e => setFormState(s=>({...s, price: e.target.value}))} placeholder={t.price} className="w-full px-3 py-2 border-transparent rounded-md bg-base-dark-100" />
                        <button type="button" onClick={handleSuggestPrice} disabled={isAnalyzing || !formState.title} className="text-sm font-semibold text-secondary hover:underline disabled:opacity-50 whitespace-nowrap">✨ {t.suggest_price}</button>
                    </div>
                    <select value={formState.category} onChange={e => setFormState(s=>({...s, category: e.target.value}))} className="w-full px-3 py-2 border-transparent rounded-md bg-base-dark-100">
                        {CATEGORIES.map(c => <option key={c} value={c}>{t[`cat_${c.toLowerCase()}` as keyof typeof t]}</option>)}
                    </select>
                    <textarea value={formState.description} onChange={e => setFormState(s=>({...s, description: e.target.value}))} placeholder={t.description} rows={4} className="w-full px-3 py-2 border-transparent rounded-md bg-base-dark-100"></textarea>
                    <input type="tel" value={formState.phone} onChange={e => setFormState(s=>({...s, phone: e.target.value}))} placeholder={t.phone_number} className="w-full px-3 py-2 border-transparent rounded-md bg-base-dark-100" />
                    {formError && <p className="text-accent text-sm text-center">{formError}</p>}
                    <button type="submit" disabled={isSubmitting} className="w-full bg-secondary text-base-dark-100 font-bold py-3 rounded-md disabled:opacity-50 flex justify-center items-center">
                        {isSubmitting ? <div className="w-6 h-6 border-2 border-current/50 border-t-base-content-dark rounded-full animate-spin"></div> : (itemToEdit ? 'Update Item' : t.post_item)}
                    </button>
                </form>
             </div>
            )
          )}
        </main>
      </div>
    </>
  );
};

export default MarketplacePage;
