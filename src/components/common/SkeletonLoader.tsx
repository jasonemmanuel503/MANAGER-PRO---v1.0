import React from 'react';

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  lines = 4,
  className = '',
}) => {
  return (
    <div className={`space-y-3.5 animate-pulse ${className}`} aria-label="Loading data">
      <div className="h-6 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl w-1/3" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-slate-200/50 dark:bg-slate-800/60 rounded-xl w-full flex items-center px-4 gap-4"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-300/60 dark:bg-slate-700/60 shrink-0" />
            <div className="h-4 bg-slate-300/50 dark:bg-slate-700/50 rounded-md w-1/4" />
            <div className="h-4 bg-slate-300/40 dark:bg-slate-700/40 rounded-md w-1/3 ml-auto" />
            <div className="w-16 h-6 bg-slate-300/50 dark:bg-slate-700/50 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
