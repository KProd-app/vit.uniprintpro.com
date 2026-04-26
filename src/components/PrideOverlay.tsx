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

interface Particle {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
  scale: number;
  opacity: number;
  rotationDuration: string;
  rotationDirection: string;
  color: string;
  type: 'heart' | 'sparkle' | 'star';
}

export const PrideOverlay: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate 100 intense particles for EXTRA pride
    const types: ('heart' | 'sparkle' | 'star')[] = ['heart', 'sparkle', 'star', 'heart', 'heart'];
    const newParticles: Particle[] = Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      left: `${random(-20, 120)}vw`,
      animationDuration: `${random(5, 15)}s`, // Faster falling speed
      animationDelay: `-${random(0, 30)}s`,
      scale: random(0.5, 2.5),
      opacity: random(0.8, 1),
      rotationDuration: `${random(1, 5)}s`, // Crazy fast rotation
      rotationDirection: Math.random() > 0.5 ? 'normal' : 'reverse',
      color: PRIDE_COLORS[Math.floor(Math.random() * PRIDE_COLORS.length)],
      type: types[Math.floor(Math.random() * types.length)]
    }));
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
            className="absolute -top-[100px] animate-fall"
            style={{
              left: p.left,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              opacity: p.opacity,
              transform: `scale(${p.scale})`,
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill={p.color}
              xmlns="http://www.w3.org/2000/svg"
              className="animate-sway drop-shadow-[0_0_10px_currentColor]"
              style={{
                animationDuration: p.rotationDuration,
                animationDirection: p.rotationDirection as any,
                color: p.color // For currentColor drop-shadow
              }}
            >
              {p.type === 'heart' && (
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              )}
              {p.type === 'star' && (
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              )}
              {p.type === 'sparkle' && (
                <path d="M12 0C12.5 6.5 17.5 11.5 24 12C17.5 12.5 12.5 17.5 12 24C11.5 17.5 6.5 12.5 0 12C6.5 11.5 11.5 6.5 12 0Z" />
              )}
            </svg>
          </div>
        ))}
      </div>
    </>
  );
};
