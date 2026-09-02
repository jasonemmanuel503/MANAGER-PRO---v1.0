import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Layers } from 'lucide-react';
import { AccountLevelRole, Level, UserRole } from '../../types';

interface LevelSwitcherProps {
  currentLevel: Level;
  currentRole: UserRole;
  allGrants: AccountLevelRole[];
  levels: Level[];
  onSwitchGrant: (grant: AccountLevelRole, level: Level) => void;
}

export const LevelSwitcher: React.FC<LevelSwitcherProps> = ({
  currentLevel,
  currentRole,
  allGrants,
  levels,
  onSwitchGrant,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Filter unique level-role combinations the user holds
  const availableGrants = allGrants.map((grant) => {
    const levelObj = levels.find((l) => l.id === grant.level_id);
    return {
      grant,
      level: levelObj,
    };
  }).filter((item): item is { grant: AccountLevelRole; level: Level } => Boolean(item.level));

  // If user only holds 1 grant, show badge without dropdown
  const hasMultipleGrants = availableGrants.length > 1;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2">
        Partition:
      </span>

      <button
        type="button"
        id="level-switcher-button"
        disabled={!hasMultipleGrants}
        onClick={() => hasMultipleGrants && setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all backdrop-blur-md shadow-xs ${
          hasMultipleGrants
            ? 'bg-white/85 dark:bg-slate-800/85 hover:bg-orange-50/60 dark:hover:bg-slate-750 text-slate-900 dark:text-white border-orange-200/80 dark:border-white/10 hover:border-orange-500/50 cursor-pointer shadow-xs hover:shadow-md'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-default'
        }`}
      >
        <Layers className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
        <span className="font-bold text-slate-900 dark:text-white">{currentLevel.name}</span>
        <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
        <span className="text-lime-700 dark:text-lime-400 bg-lime-50 dark:bg-lime-950/50 px-2 py-0.5 rounded-md text-[11px] font-bold border border-lime-600/30">
          {currentRole}
        </span>
        {hasMultipleGrants && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-orange-600' : ''
            }`}
          />
        )}
      </button>

      {isOpen && hasMultipleGrants && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-orange-950/20 dark:shadow-black/70 border border-white/60 dark:border-white/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-orange-100/60 dark:border-white/10 flex items-center justify-between">
            <span>Authorized Partitions</span>
            <span className="text-[10px] bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold border border-orange-200/50 dark:border-orange-800/50">
              {availableGrants.length} grants
            </span>
          </div>

          <div className="py-1">
            {availableGrants.map(({ grant, level }) => {
              const isActive =
                grant.level_id === currentLevel.id && grant.role === currentRole;

              return (
                <button
                  key={grant.id}
                  type="button"
                  onClick={() => {
                    onSwitchGrant(grant, level);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-orange-50/70 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-orange-50/40 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">{level.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Role: {grant.role}
                    </span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
