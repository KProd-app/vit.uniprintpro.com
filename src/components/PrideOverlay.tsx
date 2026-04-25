import React, { useEffect, useState } from 'react';

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const PRIDE_COLORS = [
  '#FF0018', // Red
  '#FFA52C', // Orange
  '#FFFF41', // Yellow
  '#008018', // Green
  '#0000F9', // Blue
  '#86007D'  // Purple
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
  type: 'star' | 'circle';
}

export const PrideOverlay: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate 40 particles
    const newParticles: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${random(-10, 100)}vw`,
      animationDuration: `${random(15, 25)}s`, // Falling speed
      animationDelay: `-${random(0, 25)}s`,
      scale: random(0.3, 1.0),
      opacity: random(0.6, 1),
      rotationDuration: `${random(3, 8)}s`,
      rotationDirection: Math.random() > 0.5 ? 'normal' : 'reverse',
      color: PRIDE_COLORS[Math.floor(Math.random() * PRIDE_COLORS.length)],
      type: Math.random() > 0.5 ? 'star' : 'circle'
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Subtle animated rainbow glow at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-purple-500/10 blur-2xl animate-pulse"></div>
      
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
            className="animate-sway drop-shadow-md"
            style={{
              animationDuration: p.rotationDuration,
              animationDirection: p.rotationDirection as any,
            }}
          >
            {p.type === 'star' ? (
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            ) : (
              <circle cx="12" cy="12" r="10" />
            )}
          </svg>
        </div>
      ))}
    </div>
  );
};
