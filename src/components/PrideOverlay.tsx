import React, { useEffect, useState } from 'react';

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const PRIDE_COLORS = [
  '#E40303', // Red
  '#FF8C00', // Orange
  '#FFED00', // Yellow
  '#008026', // Green
  '#004DFF', // Blue
  '#732982'  // Purple
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
}

export const PrideOverlay: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate 50 heart particles
    const newParticles: Particle[] = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${random(-10, 100)}vw`,
      animationDuration: `${random(10, 20)}s`, // Falling speed
      animationDelay: `-${random(0, 25)}s`,
      scale: random(0.5, 1.5),
      opacity: random(0.6, 1),
      rotationDuration: `${random(3, 8)}s`,
      rotationDirection: Math.random() > 0.5 ? 'normal' : 'reverse',
      color: PRIDE_COLORS[Math.floor(Math.random() * PRIDE_COLORS.length)]
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      {/* Full screen animated rainbow background with glassmorphism overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          background: 'linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #dd00f3)',
          backgroundSize: '1800% 1800%',
          animation: 'rainbow-bg 15s ease infinite'
        }}
      />
      
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute -top-[50px] animate-fall"
            style={{
              left: p.left,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              opacity: p.opacity,
              transform: `scale(${p.scale})`,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={p.color}
              xmlns="http://www.w3.org/2000/svg"
              className="animate-sway drop-shadow-lg"
              style={{
                animationDuration: p.rotationDuration,
                animationDirection: p.rotationDirection as any,
              }}
            >
               {/* Heart SVG */}
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        ))}
      </div>
    </>
  );
};
