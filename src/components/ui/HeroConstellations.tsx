'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';

// ── CONFIG ──
const CONSTELLATION_CONFIG = [
  // Top (5)
  { id: 't1', x: 8, y: 8, size: 100, stars: 8 },
  { id: 't2', x: 28, y: 6, size: 90, stars: 6 },
  { id: 't3', x: 50, y: 8, size: 110, stars: 10 },
  { id: 't4', x: 72, y: 6, size: 90, stars: 6 },
  { id: 't5', x: 92, y: 8, size: 100, stars: 8 },
  // Left (4)
  { id: 'l1', x: 5, y: 25, size: 140, stars: 9 },
  { id: 'l2', x: 4, y: 45, size: 130, stars: 8 },
  { id: 'l3', x: 6, y: 65, size: 140, stars: 10 },
  { id: 'l4', x: 5, y: 85, size: 120, stars: 7 },
  // Right (4)
  { id: 'r1', x: 95, y: 25, size: 140, stars: 9 },
  { id: 'r2', x: 96, y: 45, size: 130, stars: 8 },
  { id: 'r3', x: 94, y: 65, size: 140, stars: 10 },
  { id: 'r4', x: 95, y: 85, size: 120, stars: 7 },
  // Bottom (3)
  { id: 'b1', x: 20, y: 92, size: 110, stars: 8 },
  { id: 'b2', x: 50, y: 94, size: 130, stars: 12 },
  { id: 'b3', x: 80, y: 92, size: 110, stars: 8 }
];

const REVEAL_START_PX = 200;
const PEAK_VISIBLE_PX = 80;
const MAX_OPACITY = 0.85;
const EXCLUSION_RADIUS_PCT = 22; // Hard center exclusion (44% width/height zone)

// ── HELPER: RANDOM CONSTELLATION NODES ──
const generateNodes = (count: number) => {
  const nodes = Array.from({ length: count }).map((_, i) => ({
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
  }));
  return nodes;
};

export default function HeroConstellations() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const constellationsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cursorRef = useRef({ x: -1000, y: -1000 });
  const opacityStates = useRef<number[]>(new Array(16).fill(0));
  const lastVisibleTime = useRef<number[]>(new Array(16).fill(0));

  // Layer 1: Ambient Stars
  const ambientStars = useMemo(() => Array.from({ length: 60 }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    s: 0.5 + Math.random() * 1,
    o: 0.05 + Math.random() * 0.1
  })), []);

  // Node data for each constellation
  const nodeData = useMemo(() => CONSTELLATION_CONFIG.map(c => generateNodes(c.stars)), []);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let rafId: number;
    const update = (time: number) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const cx = cursorRef.current.x - rect.left;
      const cy = cursorRef.current.y - rect.top;
      
      const width = rect.width;
      const height = rect.height;

      // Hard Center Exclusion Zone Check
      const centerDistX = Math.abs((cx / width) * 100 - 50);
      const centerDistY = Math.abs((cy / height) * 100 - 50);
      const isInExclusionZone = centerDistX < EXCLUSION_RADIUS_PCT && centerDistY < EXCLUSION_RADIUS_PCT;

      CONSTELLATION_CONFIG.forEach((config, i) => {
        const el = constellationsRef.current[i];
        if (!el) return;

        const hx = (config.x / 100) * width;
        const hy = (config.y / 100) * height;

        // Euclidean Distance
        const dx = cx - hx;
        const dy = cy - hy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetOpacity = 0;
        if (!isInExclusionZone) {
          if (dist < PEAK_VISIBLE_PX) {
            targetOpacity = MAX_OPACITY;
          } else if (dist < REVEAL_START_PX) {
            const factor = 1 - (dist - PEAK_VISIBLE_PX) / (REVEAL_START_PX - PEAK_VISIBLE_PX);
            targetOpacity = factor * MAX_OPACITY;
          }
        }

        // Exit Logic: 200ms hold + 300ms fade
        let currentOpacity = opacityStates.current[i];
        
        if (targetOpacity > 0.1) {
          lastVisibleTime.current[i] = time;
          // Fast fade in
          currentOpacity += (targetOpacity - currentOpacity) * 0.15;
        } else {
          const timeSinceVisible = time - lastVisibleTime.current[i];
          if (timeSinceVisible > 200) { // Hold finished
            // Slow fade out
            currentOpacity *= 0.92; 
            if (currentOpacity < 0.01) currentOpacity = 0;
          }
        }

        opacityStates.current[i] = currentOpacity;
        
        // Apply Style Directly
        el.style.opacity = currentOpacity.toString();
        
        // Active drift/twinkle logic (CSS handle)
        if (currentOpacity > 0.2) {
          el.classList.add('is-active');
        } else {
          el.classList.remove('is-active');
        }

        // Parallax: slight shift
        const pFactor = 0.02;
        el.style.transform = `translate(${(cx - hx) * pFactor}px, ${(cy - hy) * pFactor}px) translate(-50%, -50%)`;
      });

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* ── LAYER 1: AMBIENT STATIC STARS ── */}
      <div className="absolute inset-0 opacity-40">
        {ambientStars.map((s, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-white" 
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }} 
          />
        ))}
      </div>

      {/* ── LAYER 2: INTERACTIVE CONSTELLATIONS ── */}
      <div className="absolute inset-0">
        {CONSTELLATION_CONFIG.map((config, i) => (
          <div
            key={config.id}
            ref={el => { constellationsRef.current[i] = el; }}
            className="constellation-wrapper"
            style={{
              left: `${config.x}%`,
              top: `${config.y}%`,
              width: config.size,
              height: config.size,
              opacity: 0
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <path
                d={`M ${nodeData[i][0].x} ${nodeData[i][0].y} ${nodeData[i].slice(1).map(n => `L ${n.x} ${n.y}`).join(' ')} Z`}
                fill="none"
                stroke="rgba(167, 139, 250, 0.2)"
                strokeWidth="0.5"
                className="connector-line"
              />
              {nodeData[i].map((node, ni) => (
                <circle
                  key={ni}
                  cx={node.x}
                  cy={node.y}
                  r={0.8 + Math.random() * 0.4}
                  fill={ni % 3 === 0 ? "#a78bfa" : "#fff"}
                  className="star-node"
                />
              ))}
            </svg>
          </div>
        ))}
      </div>

      {/* ── EXTRA GLOWS (Edges) ── */}
      <div className="absolute inset-0 z-[-1] hide-mobile">
        <div className="absolute top-[5%] left-[-5%] w-[400px] h-[400px] bg-violet-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-[-5%] w-[500px] h-[500px] bg-emerald-600/5 blur-[150px] rounded-full" />
      </div>
    </div>
  );
}
