'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// ── TYPES & CONSTANTS ──
interface Point { x: number; y: number; id: string; }
interface ConstellationProps {
  homeX: number;
  homeY: number;
  size: number;
  starsCount: number;
  delay: number;
  mouseX: any;
  mouseY: any;
  isBright?: boolean;
  isSmall?: boolean;
}

const POSITIONS = [
  // Top (x, y=6%)
  { x: 6, y: 6 }, { x: 14, y: 5 }, { x: 24, y: 7 }, { x: 36, y: 6 }, { x: 73, y: 5 }, { x: 84, y: 7 },
  // Left (x, y)
  { x: 3, y: 22 }, { x: 5, y: 40 }, { x: 4, y: 58 }, { x: 8, y: 76 },
  // Right (x, y)
  { x: 92, y: 25 }, { x: 95, y: 43 }, { x: 93, y: 61 }, { x: 89, y: 79 },
  // Bottom (x, y)
  { x: 18, y: 88 }, { x: 47, y: 90 }, { x: 78, y: 87 }
];

// ── HELPER: RANDOM CONSTELLATION GENERATOR ──
const generateStars = (count: number): Point[] => {
  return Array.from({ length: count }).map((_, i) => ({
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    id: `star-${i}-${Math.random().toString(36).substr(2, 5)}`
  }));
};

const Constellation: React.FC<ConstellationProps> = ({ 
  homeX, homeY, size, starsCount, delay, mouseX, mouseY, isBright, isSmall 
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stars] = useState(() => generateStars(starsCount));
  
  // Reposition cycle: 8 to 14 seconds
  useEffect(() => {
    const cycle = () => {
      const range = 40; // 20 to 60px roughly
      setOffset({
        x: (Math.random() - 0.5) * range * 2,
        y: (Math.random() - 0.5) * range * 2
      });
      setTimeout(cycle, 8000 + Math.random() * 6000);
    };
    const initialTimeout = setTimeout(cycle, delay * 1000);
    return () => clearTimeout(initialTimeout);
  }, [delay]);

  // Parallax offset
  const px = useSpring(0, { stiffness: 50, damping: 20 });
  const py = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    return mouseX.on("change", (latest: number) => {
      const factor = isSmall ? 15 : 30; // Further back layers move less
      px.set((latest - homeX) * factor * 0.01);
    });
  }, [mouseX, homeX, isSmall, px]);

  useEffect(() => {
    return mouseY.on("change", (latest: number) => {
      const factor = isSmall ? 15 : 30;
      py.set((latest - homeY) * factor * 0.01);
    });
  }, [mouseY, homeY, isSmall, py]);

  return (
    <motion.div
      className={`absolute pointer-events-none ${isSmall ? 'opacity-40' : 'opacity-70'}`}
      style={{
        left: `${homeX}%`,
        top: `${homeY}%`,
        width: size,
        height: size,
        x: offset.x,
        y: offset.y,
        translateX: px,
        translateY: py,
        transform: 'translate(-50%, -50%)',
      }}
      transition={{
        x: { duration: 10, ease: "linear", repeat: Infinity, repeatType: "alternate" },
        y: { duration: 12, ease: "linear", repeat: Infinity, repeatType: "alternate" },
      }}
    >
      <svg 
        viewBox="0 0 100 100" 
        style={{ 
          width: '100%', height: '100%',
          filter: isBright ? 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.4))' : 'none'
        }}
      >
        {/* Connector lines loop */}
        <motion.path
          d={`M ${stars[0].x} ${stars[0].y} ${stars.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} Z`}
          fill="none"
          stroke="rgba(167, 139, 250, 0.2)"
          strokeWidth="0.5"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Individual stars */}
        {stars.map((star, i) => (
          <motion.circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={0.8 + Math.random() * 0.8}
            fill={i % 4 === 0 ? "#a78bfa" : "#fff"}
            initial={{ opacity: 0.3 + Math.random() * 0.4 }}
            animate={{ 
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 4
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
};

export default function HeroConstellations() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 100);
      mouseY.set((e.clientY / window.innerHeight) * 100);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const staticStars = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 1,
      opacity: 0.1 + Math.random() * 0.4,
      delay: Math.random() * 5
    }));
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* ── LAYER 1: STATIC BACKGROUND STARS ── */}
      <div className="absolute inset-0 z-0">
        {staticStars.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            }}
            animate={{ opacity: [s.opacity, s.opacity * 2, s.opacity] }}
            transition={{ duration: 3 + s.delay, repeat: Infinity }}
          />
        ))}
      </div>

      {/* ── LAYER 3: BLURRED GLOWS (Outer Edges) ── */}
      <div className="absolute inset-0 z-1 hide-mobile">
        <div className="absolute top-[10%] left-[5%] w-[400px] height-[400px] rounded-full bg-violet-600/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] height-[500px] rounded-full bg-emerald-600/5 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── LAYER 2: INTERACTIVE CONSTELLATIONS ── */}
      <div className="absolute inset-0 z-2">
        {POSITIONS.map((pos, idx) => {
          // Logic for size and brightness based on position
          const isNearNav = pos.y < 15;
          const isNearCTA = pos.x > 40 && pos.x < 60 && pos.y > 50 && pos.y < 80;
          const isNearStats = pos.y > 80;
          const isSide = pos.x < 15 || pos.x > 85;

          return (
            <div key={idx} className={idx > 9 ? 'hide-mobile' : ''}>
              <Constellation
                homeX={pos.x}
                homeY={pos.y}
                size={isSide ? 140 : isNearNav ? 80 : 110}
                starsCount={isNearStats ? 12 : 7}
                delay={idx * 0.2}
                mouseX={mouseX}
                mouseY={mouseY}
                isBright={isNearCTA}
                isSmall={isNearNav}
              />
            </div>
          );
        })}
      </div>

      {/* Safe Area Exclusion Mask (Radial Gradient) */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 40%, rgba(9, 9, 15, 0.1) 60%, rgba(9, 9, 15, 0.4) 100%)'
        }}
      />
    </div>
  );
}
