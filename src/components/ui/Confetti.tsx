import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A lightweight confetti component using Framer Motion.
 * No external dependencies required.
 */
export default function Confetti({ duration = 3000 }: { duration?: number }) {
  const [isVisible, setIsVisible] = useState(true);
  const colors = ['#22c55e', '#f97316', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6'];
  const particles = Array.from({ length: 40 });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((_, i) => {
            const size = Math.random() * 8 + 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const xDelta = (Math.random() - 0.5) * 400; // spread
            
            return (
              <motion.div
                key={i}
                initial={{ 
                  x: '50vw', 
                  y: '100vh', 
                  opacity: 1, 
                  scale: 1, 
                  rotate: 0 
                }}
                animate={{ 
                  x: `calc(50vw + ${xDelta}px)`, 
                  y: '-10vh', 
                  opacity: 0, 
                  scale: 0.5, 
                  rotate: 360 * 2 
                }}
                transition={{ 
                  duration: Math.random() * 2 + 1.5, 
                  ease: [0.23, 0.82, 0.43, 0.95],
                  delay: Math.random() * 0.2
                }}
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
