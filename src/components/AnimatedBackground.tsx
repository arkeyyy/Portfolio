import { useEffect, useState } from 'react';

const starPalette = [
  'var(--about)',
  'var(--projects)',
  'var(--skills)',
  'var(--certifications)',
  'var(--education)',
  'var(--contact)',
];

const stars = [
  { x: 6, y: 14, size: 1.8, delay: 0.2 },
  { x: 8, y: 88, size: 1.4, delay: 3.9 },
  { x: 11, y: 46, size: 1.2, delay: 2.7 },
  { x: 14, y: 72, size: 2.2, delay: 1.1 },
  { x: 19, y: 22, size: 1.5, delay: 3.4 },
  { x: 23, y: 88, size: 1.3, delay: 0.8 },
  { x: 25, y: 57, size: 1.7, delay: 2.3 },
  { x: 28, y: 36, size: 2.4, delay: 2.1 },
  { x: 33, y: 63, size: 1.6, delay: 4.2 },
  { x: 37, y: 8, size: 1.3, delay: 1.8 },
  { x: 40, y: 27, size: 1.5, delay: 4.5 },
  { x: 42, y: 82, size: 2, delay: 3.1 },
  { x: 46, y: 49, size: 1.2, delay: 0.4 },
  { x: 51, y: 18, size: 2.1, delay: 2.4 },
  { x: 55, y: 71, size: 1.5, delay: 4.6 },
  { x: 57, y: 4, size: 1.8, delay: 0.7 },
  { x: 59, y: 39, size: 1.3, delay: 1.4 },
  { x: 63, y: 92, size: 2.3, delay: 3.8 },
  { x: 67, y: 11, size: 1.4, delay: 0.9 },
  { x: 71, y: 57, size: 1.8, delay: 2.9 },
  { x: 74, y: 44, size: 1.3, delay: 3.7 },
  { x: 76, y: 29, size: 2.2, delay: 4.4 },
  { x: 79, y: 79, size: 1.2, delay: 1.6 },
  { x: 83, y: 7, size: 1.7, delay: 3.6 },
  { x: 86, y: 48, size: 1.4, delay: 0.6 },
  { x: 88, y: 74, size: 1.6, delay: 1.3 },
  { x: 89, y: 90, size: 2, delay: 2.5 },
  { x: 92, y: 23, size: 1.3, delay: 4.8 },
  { x: 95, y: 66, size: 2.1, delay: 1.9 },
  { x: 97, y: 38, size: 1.5, delay: 3.3 },
] as const;

function getNextColor(previousColor: string) {
  const availableColors = starPalette.filter((color) => color !== previousColor);
  return availableColors[Math.floor(Math.random() * availableColors.length)];
}

export default function AnimatedBackground() {
  const [starColors, setStarColors] = useState(() =>
    stars.map((_, index) => starPalette[index % starPalette.length]),
  );

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let colorInterval: number | undefined;

    const syncColorAnimation = () => {
      if (colorInterval !== undefined) {
        window.clearInterval(colorInterval);
        colorInterval = undefined;
      }

      if (!motionPreference.matches) {
        colorInterval = window.setInterval(() => {
          setStarColors((currentColors) => currentColors.map(getNextColor));
        }, 1500);
      }
    };

    syncColorAnimation();
    motionPreference.addEventListener('change', syncColorAnimation);

    return () => {
      motionPreference.removeEventListener('change', syncColorAnimation);
      if (colorInterval !== undefined) window.clearInterval(colorInterval);
    };
  }, []);

  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-cosmos">
        <div className="cosmic-stars">
          {stars.map((star, index) => (
            <span
              key={`${star.x}-${star.y}`}
              className="cosmic-star"
              style={{
                top: `${star.y}%`,
                left: `${star.x}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                color: starColors[index],
                animationDelay: `-${star.delay}s`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />
      <div className="ambient-orb ambient-orb-three" />
      <div className="ambient-orb ambient-orb-four" />
      <div className="ambient-noise" />
    </div>
  );
}
