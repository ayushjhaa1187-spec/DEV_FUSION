'use client';

import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  relX?: number; 
  relY?: number;
}

interface Cluster {
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  points: Point[];
  baseAlpha: number;
}

interface BgStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface ConstellationBackgroundProps {
  opacity?: number;
  interactive?: boolean;
}

export default function ConstellationBackground({ 
  opacity = 1, 
  interactive = true 
}: ConstellationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0;
    let H = 0;
    
    let clusters: Cluster[] = [];
    let bgStars: BgStar[] = [];
    const interactionRadius = 250; // Increased radius to activate clusters easier
    
    const mouse = { x: -999, y: -999, active: false };

    // Standard constellation shapes (relative coordinates 0-1)
    const defs = [
      {
        name: 'Orion',
        pts: [
          { x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 }, // Shoulders
          { x: 0.4, y: 0.5 }, { x: 0.5, y: 0.52 }, { x: 0.6, y: 0.48 }, // Belt
          { x: 0.3, y: 0.8 }, { x: 0.7, y: 0.9 } // Knees
        ]
      },
      {
        name: 'Cassiopeia',
        pts: [
          { x: 0.1, y: 0.5 }, { x: 0.3, y: 0.8 }, 
          { x: 0.5, y: 0.4 }, { x: 0.7, y: 0.7 }, { x: 0.9, y: 0.3 }
        ]
      },
      {
        name: 'Ursa Major',
        pts: [
          { x: 0.9, y: 0.2 }, { x: 0.7, y: 0.3 }, { x: 0.5, y: 0.35 },
          { x: 0.3, y: 0.5 }, { x: 0.1, y: 0.7 }, { x: 0.4, y: 0.8 }, { x: 0.3, y: 0.5 }
        ]
      },
       {
        name: 'Cygnus',
        pts: [
          { x: 0.5, y: 0.1 }, { x: 0.5, y: 0.3 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.9 }, // Spine
          { x: 0.1, y: 0.4 }, { x: 0.3, y: 0.4 }, { x: 0.7, y: 0.4 }, { x: 0.9, y: 0.4 } // Wings
        ]
      },
      {
        name: 'Lyra',
        pts: [
          { x: 0.5, y: 0.1 }, { x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }, { x: 0.4, y: 0.9 }, { x: 0.6, y: 0.9 }
        ]
      }
    ];

    function resize() {
      if (canvas) {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        initParticles();
      }
    }

    function initParticles() {
      clusters = [];
      bgStars = [];
      
      // Calculate how many clusters based on screen area to avoid "dead" areas
      const numClusters = Math.floor((W * H) / 120000); 
      
      for (let i = 0; i < Math.max(6, numClusters); i++) {
        const def = defs[i % defs.length];
        
        clusters.push({
          name: def.name,
          x: Math.random() * W,
          y: Math.random() * H,
          // Autonomous slow drift in random directions
          vx: (Math.random() - 0.5) * 0.15, 
          vy: (Math.random() - 0.5) * 0.15, 
          scale: Math.random() * 150 + 100, 
          points: def.pts.map(p => ({ ...p, x: 0, y: 0, relX: p.x, relY: p.y })),
          // Very dim when not interacting, but not invisible
          baseAlpha: Math.random() * 0.2 + 0.15 
        });
      }

      const numBg = Math.floor((W * H) / 6000); // Dense background starfield

      for (let i = 0; i < Math.max(150, numBg); i++) {
        bgStars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.4 + 0.1
        });
      }
    }

    let animId: number;

    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, W, H);

      const baseThemeColor = '167, 139, 250'; // Indigo-400 equivalent for standard
      const brightColor = '255, 255, 255'; // Pure white/bright for hits

      // --- Render Background Stars ---
      bgStars.forEach(st => {
        st.x += st.vx;
        st.y += st.vy;
        if (st.x < 0) st.x = W;
        if (st.x > W) st.x = 0;
        if (st.y < 0) st.y = H;
        if (st.y > H) st.y = 0;

        ctx.beginPath();
        ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseThemeColor}, ${st.alpha * opacity})`;
        ctx.fill();
      });

      // --- Render Constellation Clusters ---
      clusters.forEach(cl => {
        // Move the whole cluster
        cl.x += cl.vx;
        cl.y += cl.vy;
        
        // Wrap around screen
        if (cl.x < -cl.scale) cl.x = W + cl.scale;
        if (cl.x > W + cl.scale) cl.x = -cl.scale;
        if (cl.y < -cl.scale) cl.y = H + cl.scale;
        if (cl.y > H + cl.scale) cl.y = -cl.scale;

        let clusterHovered = false;
        let maxHoverFactor = 0;

        // Update absolute coordinates of points for this frame
        cl.points.forEach(p => {
          p.x = cl.x + (p.relX! - 0.5) * cl.scale;
          p.y = cl.y + (p.relY! - 0.5) * cl.scale;
        });
        
        // Render point-to-point connections within cluster
        for (let i = 0; i < cl.points.length; i++) {
          const p1 = cl.points[i];
          
          let hoverFactor = 0;
          if (interactive && mouse.active) {
            const dx = mouse.x - p1.x;
            const dy = mouse.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < interactionRadius) {
              hoverFactor = 1 - (dist / interactionRadius);
              // Spring deformation effect
              p1.x -= (dx / dist) * hoverFactor * 10;
              p1.y -= (dy / dist) * hoverFactor * 10;
              clusterHovered = true;
              if (hoverFactor > maxHoverFactor) maxHoverFactor = hoverFactor;
            }
          }

          // Render Star Point
          const radius = clusterHovered ? 2 + hoverFactor * 2.5 : 1.5;
          const alpha = clusterHovered ? Math.max(cl.baseAlpha, 0.6) + (hoverFactor * 0.4) : cl.baseAlpha;
          
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
          
          if (hoverFactor > 0.4) {
             ctx.fillStyle = `rgba(${brightColor}, ${alpha * opacity})`;
             ctx.shadowBlur = 20;
             ctx.shadowColor = `rgba(${brightColor}, 1)`;
          } else {
             ctx.fillStyle = `rgba(${baseThemeColor}, ${alpha * opacity})`;
             ctx.shadowBlur = clusterHovered ? 10 : 3;
             ctx.shadowColor = `rgba(${baseThemeColor}, ${clusterHovered ? 0.8 : 0.3})`;
          }
          ctx.fill();
          ctx.shadowBlur = 0;

          // Render connecting lines
          for (let j = i + 1; j < cl.points.length; j++) {
            const p2 = cl.points[j];
            const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
            
            if (dist < cl.scale * 0.85) {
              let lineAlpha = clusterHovered 
                ? 0.5 * (1 - dist/(cl.scale*0.85)) + (maxHoverFactor * 0.5) 
                : 0.12 * (1 - dist/(cl.scale*0.85));
                
              let lineWidth = clusterHovered ? 1.5 + (maxHoverFactor * 2) : 0.8;

              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              
              if (hoverFactor > 0.3) {
                 ctx.strokeStyle = `rgba(${brightColor}, ${lineAlpha * opacity})`;
              } else {
                 ctx.strokeStyle = `rgba(${baseThemeColor}, ${lineAlpha * opacity})`;
              }
              
              ctx.lineWidth = lineWidth;
              ctx.stroke();
            }
          }
        }
      });

      animId = requestAnimationFrame(render);
    }

    // Capture mouse globally
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    
    // Dim out when leaving the window
    const onMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    
    resize();
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [opacity, interactive]);

  return (
    <canvas 
      ref={canvasRef} 
      // Very slight mix-blend mode to ensure the lines don't distract from solid text
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen transition-opacity duration-1000"
      style={{ opacity, backgroundColor: 'transparent' }}
    />
  );
}
