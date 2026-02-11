import React from 'react';
import { motion } from 'framer-motion';

interface VisualizerProps {
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  return (
    <div className="flex items-end justify-center gap-1 h-8 w-24">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-orange-500 rounded-t-sm"
          animate={{
            height: isPlaying ? ['20%', '80%', '40%'] : '10%'
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};
