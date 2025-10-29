import Image from 'next/image';

interface MustacheIconProps {
  className?: string;
  size?: number;
}

export function MustacheIcon({ className = '', size = 40 }: MustacheIconProps) {
  return (
    <Image
      src="/mustache.svg"
      alt="Mustache"
      width={size}
      height={size * 0.4} // Mustaches are wider than tall
      className={className}
      priority
    />
  );
}

// Inline SVG version - Clean handlebar mustache
export function MustacheSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 30" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M 5,15
               C 5,15 10,8 15,8
               C 20,8 22,12 25,13
               C 30,14 35,15 40,15
               C 42,15 45,14 48,12
               C 49,11 50,10 50,8
               L 50,8
               C 50,10 51,11 52,12
               C 55,14 58,15 60,15
               C 65,15 70,14 75,13
               C 78,12 80,8 85,8
               C 90,8 95,15 95,15
               C 95,15 93,20 88,20
               C 83,20 80,16 77,15
               C 72,13 67,13 62,13
               C 58,13 54,14 52,15
               C 51,16 50,18 50,20
               L 50,20
               C 50,18 49,16 48,15
               C 46,14 42,13 38,13
               C 33,13 28,13 23,15
               C 20,16 17,20 12,20
               C 7,20 5,15 5,15 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinejoin="round"/>
    </svg>
  );
}
