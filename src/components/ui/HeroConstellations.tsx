'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConstellationDef {
  name: string;
  points: { x: number; y: number }[];
}

const CONSTELLATIONS: { points: { x: number; y: number }[] }[] = Array.from({ length: 16 }).map((_, i) => ({
  points: Array.from({ length: 3 + Math.floor(Math.random() * 5) }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
  })),
}));

export default function HeroConstellations() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {CONSTELLATIONS.map((constellation, idx) => {
        const radius = 25 + Math.random() * 25; // % distance from center
        const startAngle = (idx / 16) * 360;
        const speed = 60 + Math.random() * 120; // seconds for full rotation
        const clockwise = idx % 2 === 0;

        return (
          <motion.div
            key={idx}
            className="absolute left-1/2 top-1/2"
            animate={{
              rotate: clockwise ? 360 : -360,
            }}
            transition={{
              rotate: {
                duration: speed,
                repeat: Infinity,
                ease: "linear",
              },
            }}
            style={{
              width: '1px',
              height: '1px',
            }}
          >
            <motion.div
              className="absolute"
              style={{
                left: `${radius}vw`,
                width: '150px',
                height: '150px',
                transform: `rotate(${startAngle}deg)`,
              }}
              animate={{
                opacity: [0.1, 0.4, 0.1],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_12px_rgba(167,139,250,0.3)]">
                {/* Lines linking points */}
                <polyline
                  points={constellation.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="rgba(167, 139, 250, 0.15)"
                  strokeWidth="0.8"
                />
                {/* Star points */}
                {constellation.points.map((p, i) => (
                  <motion.circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="1.2"
                    fill="#fff"
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                      r: [1.2, 2.2, 1.2]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 3,
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                  />
                ))}
              </svg>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
