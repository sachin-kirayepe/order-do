import { motion } from 'framer-motion';

export default function Loader({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-6 h-6 bg-brand-primary/20 rounded-full blur-sm"
      />
      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
        className="w-5 h-5 border-2 border-brand-primary/10 border-t-brand-primary rounded-full relative z-10"
      />
    </div>
  );
}
