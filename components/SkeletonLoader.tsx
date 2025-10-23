import React from 'react';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-base-dark-200/50 p-4 rounded-xl shadow-lg animate-pulse ${className}`}>
        <div className="h-4 bg-base-dark-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
            <div className="h-3 bg-base-dark-300 rounded w-full"></div>
            <div className="h-3 bg-base-dark-300 rounded w-5/6"></div>
        </div>
    </div>
);

export const SkeletonImageCard: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-base-dark-200/50 rounded-xl shadow-lg animate-pulse overflow-hidden ${className}`}>
        <div className="h-48 bg-base-dark-300"></div>
        <div className="p-4">
            <div className="h-4 bg-base-dark-300 rounded w-2/3 mb-3"></div>
            <div className="h-3 bg-base-dark-300 rounded w-full"></div>
            <div className="h-3 bg-base-dark-300 rounded w-full mt-2"></div>
        </div>
    </div>
);
