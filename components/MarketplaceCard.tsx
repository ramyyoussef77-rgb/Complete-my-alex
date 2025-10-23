
import React from 'react';
import { MarketplaceItem } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface MarketplaceCardProps {
  item: MarketplaceItem;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ item, onSelect, onEdit, onDelete, isOwner = false }) => {
  const t = useTranslations();

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>, action?: () => void) => {
    e.stopPropagation();
    action?.();
  };

  return (
    <div onClick={onSelect} className="block w-full h-full group cursor-pointer">
      <div className="bg-base-dark-200 rounded-xl overflow-hidden h-full flex flex-col shadow-lg dark:shadow-none transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1">
        <div className="relative">
          <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <p className="absolute bottom-2 right-2 text-lg font-bold text-white bg-secondary/90 px-2 py-0.5 rounded-md shadow-md">{item.price}</p>
        </div>
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-semibold text-base-content-dark truncate group-hover:text-secondary transition-colors text-sm">{item.title}</h3>
          <p className="text-base-content-dark/80 text-xs line-clamp-2 flex-1 mt-1">{item.description}</p>
          {isOwner && onEdit && onDelete && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
              <button onClick={(e) => handleButtonClick(e, onEdit)} className="flex-1 text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/40">{t.edit}</button>
              <button onClick={(e) => handleButtonClick(e, onDelete)} className="flex-1 text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/40">{t.delete}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MarketplaceCard);