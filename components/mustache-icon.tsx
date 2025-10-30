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

// Image version using bart.png
export function MustacheSVG({ className = '' }: { className?: string }) {
  return (
    <div className={`${className} overflow-hidden flex items-center justify-center`}>
      <Image
        src="/images/bart.png"
        alt="Bart"
        width={1536}
        height={1024}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center'
        }}
        quality={100}
        priority
        unoptimized
      />
    </div>
  );
}
