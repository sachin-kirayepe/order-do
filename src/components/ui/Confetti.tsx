import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A Premium lightweight confetti component using Framer Motion.
 * Optimized for high-fidelity "Liquid Glass" theme.
 */
export default function Confetti({ duration = 4000 }: { duration?: number }) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Premium HSL-based palette
  const colors = [
    'hsla(142, 70%, 50%, 0.8)', // brand-primary
    'hsla(25, 95%, 55%, 0.8)',  // brand-secondary
    'hsla(217, 91%, 60%, 0.8)', // blue
    'hsla(45, 93%, 47%, 0.8)',  // gold
    'hsla(330, 81%, 60%, 0.8)', // pink
    'hsla(0, 0%, 100%, 0.6)'    // white/glass
  ];

  const [particles] = useState(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    size: Math.random() * 10 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    xStart: Math.random() * 100, // percentage
    yStart: -10,
    xEnd: (Math.random() - 0.5) * 200, // drift
    yEnd: 110,
    rotation: Math.random() * 720,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 0.5,
    isRound: Math.random() > 0.4
  })));

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden rounded-[inherit]">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ 
                left: `${p.xStart}%`, 
                top: `${p.yStart}%`, 
                opacity: 0, 
                scale: 0,
                rotate: 0 
              }}
              animate={{ 
                top: `${p.yEnd}%`, 
                left: `${p.xStart + (p.xEnd / 10)}%`,
                opacity: [0, 1, 1, 0.5, 0], 
                scale: [0, 1, 1, 0.8, 0], 
                rotate: p.rotation 
              }}
              transition={{ 
                duration: p.duration, 
                ease: "linear",
                delay: p.delay
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.isRound ? p.size : p.size * 0.4,
                backgroundColor: p.color,
                borderRadius: p.isRound ? '50%' : '1px',
                boxShadow: `0 0 10px ${p.color}`,
                backdropFilter: 'blur(2px)',
                zIndex: 50
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
