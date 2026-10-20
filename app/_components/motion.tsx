'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '@/app/_shared/lib/utils/cn';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Becomes true once, the first time the element scrolls into view. */
function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/** Fades and lifts its children in when scrolled into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  from = 'up',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: 'up' | 'left' | 'right';
  as?: 'div' | 'li';
}) {
  const [ref, visible] = useInView<HTMLDivElement & HTMLLIElement>(0.15);

  return (
    <Tag
      ref={ref}
      data-from={from}
      data-visible={visible || undefined}
      className={cn('reveal', className)}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Counts from zero up to `value` when scrolled into view. */
export function CountUp({
  value,
  decimals = 0,
  duration = 1600,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const format = (n: number) =>
    n.toLocaleString('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: decimals });

  // The server renders the final value so the number is right without JS. Once
  // hydrated, the text is driven directly so counting doesn't re-render React.
  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion() || value === 0) return;
    if (!inView) {
      element.textContent = format(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      element.textContent = format(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- format only depends on decimals
  }, [inView, value, decimals, duration, ref]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {format(value)}
    </span>
  );
}

// November in Oslo is UTC+1.
const EVENT_START = Date.parse('2026-11-01T00:00:00+01:00');
const EVENT_END = Date.parse('2026-12-01T00:00:00+01:00');
const DAY = 86_400_000;

function subscribeToClock(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
// Snapshots must be stable between ticks, so round to the second.
const getNow = () => Math.floor(Date.now() / 1000) * 1000;
const getServerNow = () => null;

/** Live countdown to the start of the event, or day progress while it runs. */
export function Countdown({ className }: { className?: string }) {
  const now = useSyncExternalStore(subscribeToClock, getNow, getServerNow);

  if (now !== null && now >= EVENT_END) return null;

  if (now !== null && now >= EVENT_START) {
    const day = Math.floor((now - EVENT_START) / DAY) + 1;
    return (
      <div className={className}>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">
          Løpet er i gang
        </p>
        <p className="font-display mt-2 text-5xl font-black uppercase tabular-nums md:text-6xl">
          Dag {day} <span className="text-background/50">/ 30</span>
        </p>
        <div className="mt-4 h-2 w-full bg-background/15">
          <div
            className="h-full origin-left animate-grow-x bg-accent"
            style={{ width: `${(day / 30) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  const remaining = now === null ? null : EVENT_START - now;
  const units = [
    ['Dager', remaining === null ? null : Math.floor(remaining / DAY)],
    ['Timer', remaining === null ? null : Math.floor(remaining / 3_600_000) % 24],
    ['Min', remaining === null ? null : Math.floor(remaining / 60_000) % 60],
    ['Sek', remaining === null ? null : Math.floor(remaining / 1000) % 60],
  ] as const;

  return (
    <div className={className} aria-live="off">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">
        Start 1. november
      </p>
      <dl className="mt-3 grid grid-cols-4 gap-2">
        {units.map(([label, amount]) => (
          <div
            key={label}
            className="flex flex-col border border-background/25 bg-background/5 px-2 py-3"
          >
            <dt className="order-last mt-1 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-background/60">
              {label}
            </dt>
            <dd
              key={amount ?? 'x'}
              className="font-display animate-tick text-center text-3xl font-black tabular-nums md:text-4xl"
            >
              {amount === null ? '––' : String(amount).padStart(2, '0')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
