import React, { useEffect, useState } from 'react';

// Generates random numbers
const random = (min: number, max: number) => Math.random() * (max - min) + min;

interface Petal {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
  scale: number;
  opacity: number;
  rotationDuration: string;
  rotationDirection: string;
}

export const SpringOverlay: React.FC = () => {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    // Generate 30 petals
    const newPetals: Petal[] = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${random(-10, 100)}vw`,
      animationDuration: `${random(10, 20)}s`, // Falling speed
      animationDelay: `-${random(0, 20)}s`, // Negative delay so they are already falling when loaded
      scale: random(0.4, 1.2),
      opacity: random(0.6, 1),
      rotationDuration: `${random(4, 9)}s`, // 3D rotation speed
      rotationDirection: Math.random() > 0.5 ? 'normal' : 'reverse'
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute -top-[50px] animate-fall"
          style={{
            left: petal.left,
            animationDuration: petal.animationDuration,
            animationDelay: petal.animationDelay,
            opacity: petal.opacity,
            transform: `scale(${petal.scale})`,
          }}
        >
          <svg
            width="24"
            height="32"
            viewBox="0 0 24 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-sway drop-shadow-xl"
            style={{
              animationDuration: petal.rotationDuration,
              animationDirection: petal.rotationDirection as any,
            }}
          >
            <path
              d="M12 0C6.5 4 0 10 2 20C4 30 12 32 12 32C12 32 20 30 22 20C24 10 17.5 4 12 0Z"
              fill="url(#sakura-gradient)"
            />
            <defs>
              <linearGradient id="sakura-gradient" x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fdf2f8" />
                <stop offset="50%" stopColor="#fbcfe8" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  );
};
