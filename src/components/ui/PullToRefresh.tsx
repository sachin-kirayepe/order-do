import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

/**
 * A simple pull-to-refresh component for mobile dashboards.
 */
export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance * 0.4, PULL_THRESHOLD + 20));
      if (e.cancelable) e.preventDefault();
    } else {
      setPulling(false);
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;
    setPulling(false);
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD / 2);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-screen"
    >
      <motion.div
        animate={{ y: pullDistance }}
        className="relative z-10 bg-inherit"
      >
        {children}
      </motion.div>

      <div 
        className="absolute top-0 left-0 right-0 flex justify-center pt-4 pointer-events-none z-0"
        style={{ opacity: pullDistance / PULL_THRESHOLD }}
      >
        <div className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 transition-transform ${refreshing ? 'animate-spin' : ''}`}>
          <Loader2 
            size={20} 
            className="text-kirana-green" 
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      </div>
    </div>
  );
}
