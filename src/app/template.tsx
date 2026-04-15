'use client';

import { motion } from 'framer-motion';

/**
 * Global Page Transition Template
 * Wraps every route in a consistent entrance animation.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.23, 1, 0.32, 1], // Custom ease-out expo for premium feel
      }}
    >
      {children}
    </motion.div>
  );
}
