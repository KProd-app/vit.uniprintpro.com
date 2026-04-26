import React, { useEffect, useState } from 'react';

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const KEBAB_COLORS = [
  '#ea580c', // Orange/Spicy
  '#dc2626', // Red/Spicy
  '#166534', // Green/Salad
  '#facc15', // Yellow/Sauce
  '#78350f', // Brown/Meat
  '#ffffff', // White/Garlic
];

const KEBAB_CONTENT = ['🌯', '🍅', '🥒', '🧅', '🍟', '🌶️', '🍗', 'KEBABAS', 'AŠTRUS', 'ČESNAKINIS', 'MĖSYTĖ', 'PITA'];

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

export const KebabOverlay: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate 60 particles
    const newParticles: Particle[] = Array.from({ length: 60 }).map((_, i) => {
      const content = KEBAB_CONTENT[Math.floor(Math.random() * KEBAB_CONTENT.length)];
      // Check if it's actual text
      const isText = content.length > 2 && !['🌶️', '🍗'].includes(content);

      return {
        id: i,
        left: `${random(-20, 120)}vw`,
        animationDuration: `${random(8, 20)}s`, 
        animationDelay: `-${random(0, 30)}s`,
        scale: random(0.8, 2.5),
        opacity: random(0.8, 1),
        rotationDuration: `${random(3, 8)}s`,
        rotationDirection: Math.random() > 0.5 ? 'normal' : 'reverse',
        content,
        isText,
        color: KEBAB_COLORS[Math.floor(Math.random() * KEBAB_COLORS.length)]
      };
    });
    setParticles(newParticles);
  }, []);

  return (
    <>
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none opacity-20 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle, rgba(234,88,12,0.2) 0%, rgba(255,237,213,0.8) 100%)',
        }}
      />
      
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
                ? `0 0 10px rgba(0,0,0,0.5), 2px 2px 0px #fff, -1px -1px 0px #fff` 
                : '0 5px 15px rgba(0,0,0,0.3)'
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
