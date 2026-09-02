import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content?: string;
  text?: string;
  className?: string;
  ariaLabel?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  text,
  className = '',
  ariaLabel = 'Information details',
}) => {
  const tooltipText = content || text || '';
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; placeAbove: boolean }>({
    x: 0,
    y: 0,
    placeAbove: true,
  });

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const triggerCenterX = rect.left + rect.width / 2;
    const triggerTop = rect.top;
    const triggerBottom = rect.bottom;

    // Check if space above is tight (< 90px from top)
    const placeAbove = triggerTop > 100;
    const y = placeAbove ? triggerTop - 8 : triggerBottom + 8;

    // Ensure tooltip width (max ~280px) stays within viewport bounds
    const tooltipWidth = Math.min(280, window.innerWidth - 32);
    let x = triggerCenterX;

    // Clamp center so popover edges stay on-screen (min 16px from screen edge)
    const halfWidth = tooltipWidth / 2;
    if (x - halfWidth < 16) {
      x = 16 + halfWidth;
    } else if (x + halfWidth > window.innerWidth - 16) {
      x = window.innerWidth - 16 - halfWidth;
    }

    setCoords({ x, y, placeAbove });
  };

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    updatePosition();
    setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleToggle(e);
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  return (
    <span className={`inline-flex items-center align-middle relative ${className}`}>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-4 h-4 rounded-full bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-400/40 hover:bg-blue-500/30 dark:hover:bg-blue-500/40 focus:outline-hidden focus:ring-1 focus:ring-blue-400 inline-flex items-center justify-center cursor-pointer transition-colors shrink-0 ml-1.5 select-none"
      >
        <Info className="w-2.5 h-2.5 stroke-[2.5]" />
      </span>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          style={{
            position: 'fixed',
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: coords.placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            width: 'max-content',
            maxWidth: 'min(280px, calc(100vw - 32px))',
          }}
          className="z-50 pointer-events-auto p-3 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 border border-blue-500/30 shadow-xl shadow-black/50 backdrop-blur-md text-xs font-normal leading-relaxed text-left animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {tooltipText}
        </div>
      )}
    </span>
  );
};
