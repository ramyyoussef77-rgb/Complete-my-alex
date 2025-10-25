import React from 'react';
import { MarketplaceItem } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ItemDetailModalProps {
    item: MarketplaceItem | null;
    allItems: MarketplaceItem[];
    onClose: () => void;
    onFindSimilar: (item: MarketplaceItem) => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, onFindSimilar }) => {
    const t = useTranslations();
    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 animate-page-fade-in" onClick={onClose}>
            <div className="bg-base-dark-200 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <img src={item.imageUrl} alt={item.title} className="w-full h-64 object-cover rounded-t-lg" />
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-base-content-dark">{item.title}</h2>
                        <p className="text-2xl font-bold text-secondary flex-shrink-0 ml-4">{item.price}</p>
                    </div>
                    <p className="text-base-content-dark/80 mt-4">{item.description}</p>
                    
                    {item.tags && item.tags.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold text-base-content-dark/70 mb-1">{t.tags}</h3>
                            <div className="flex flex-wrap gap-2">
                                {item.tags.map(tag => <span key={tag} className="px-2 py-1 bg-primary/20 text-secondary text-xs rounded-full">#{tag}</span>)}
                            </div>
                        </div>
                    )}
                    
                    {item.sellerName && (
                        <div className="mt-4 pt-4 border-t border-base-content-dark/10">
                            <h3 className="font-semibold text-base-content-dark/70 mb-2">{t.seller_info}</h3>
                            <div className="flex items-center">
                                <img src={item.sellerAvatar} alt={item.sellerName} className="w-10 h-10 rounded-full" />
                                <div className="ml-3">
                                    <p className="font-semibold">{item.sellerName}</p>
                                    <p className="text-sm text-base-content-dark/70">{item.phone}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-base-content-dark/10 flex gap-4">
                    <button onClick={() => onFindSimilar(item)} className="flex-1 bg-base-content-dark/10 text-base-content-dark font-semibold py-2 rounded-lg hover:bg-base-content-dark/20">✨ {t.find_similar}</button>
                    <a href={`tel:${item.phone}`} className="flex-1 text-center bg-secondary text-base-dark-100 font-semibold py-2 rounded-lg hover:opacity-90">{t.contact_seller}</a>
                </div>
            </div>
        </div>
    );
};

export default ItemDetailModal;