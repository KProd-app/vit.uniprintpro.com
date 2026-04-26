import React, { useEffect, useState } from 'react';

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const PRIDE_COLORS = [
  '#FF0018', // Red
  '#FFA52C', // Orange
  '#FFFF41', // Yellow
  '#008018', // Green
  '#0000F9', // Blue
  '#86007D', // Purple
  '#FF007F', // Neon Pink
  '#00FFFF'  // Cyan
];

const PRIDE_CONTENT = ['🦄', '🌈', '✨', '🏳️‍🌈', '🏳️‍⚧️', 'LOVE IS LOVE', 'PRIDE', 'LGBTQ+', 'SLAY', 'YASS', '💅'];

interface Particle {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
  scale: number;
  opacity: number;
  rotationDuration: string;
  rotationDirection: string;
  content: string;
  isText: boolean;
  color: string;
}

export const PrideOverlay: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate 80 particles
    const newParticles: Particle[] = Array.from({ length: 80 }).map((_, i) => {
      const content = PRIDE_CONTENT[Math.floor(Math.random() * PRIDE_CONTENT.length)];
      // Check if it's actual text (like 'PRIDE', 'LGBTQ+') or an emoji
      const isText = content.length > 2 && !['🏳️‍🌈', '🏳️‍⚧️'].includes(content);

      return {
        id: i,
        left: `${random(-20, 120)}vw`,
        animationDuration: `${random(8, 20)}s`, // Slightly slower to be readable
        animationDelay: `-${random(0, 30)}s`,
        scale: random(0.8, 2.5),
        opacity: random(0.8, 1),
        rotationDuration: `${random(3, 8)}s`,
        rotationDirection: Math.random() > 0.5 ? 'normal' : 'reverse',
        content,
        isText,
        color: PRIDE_COLORS[Math.floor(Math.random() * PRIDE_COLORS.length)]
      };
    });
    setParticles(newParticles);
  }, []);

  return (
    <>
      {/* Intense full screen animated rainbow background */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none opacity-40 mix-blend-color-burn"
        style={{
          background: 'linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #ff2400)',
          backgroundSize: '400% 400%',
          animation: 'rainbow-bg 8s ease infinite'
        }}
      />
      {/* Disco glow overlay */}
      <div className="fixed inset-0 z-[49] pointer-events-none opacity-20 bg-gradient-to-tr from-pink-500 via-transparent to-cyan-500 mix-blend-screen animate-pulse" />
      
      <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute -top-[100px] animate-fall font-black tracking-wider whitespace-nowrap"
            style={{
              left: p.left,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              opacity: p.opacity,
              transform: `scale(${p.scale})`,
              color: p.isText ? p.color : undefined,
              textShadow: p.isText 
                ? `0 0 10px ${p.color}, 0 0 20px ${p.color}, 2px 2px 0px #fff, -2px -2px 0px #fff` 
                : '0 0 15px rgba(255,255,255,0.8)'
            }}
          >
            <div
              className="animate-sway"
              style={{
                animationDuration: p.rotationDuration,
                animationDirection: p.rotationDirection as any,
              }}
            >
              {p.content}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
