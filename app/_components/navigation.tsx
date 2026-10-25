'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/_shared/components/ui/button';
import { YearSelector } from './year-selector';
import { usePathname } from 'next/navigation';
import { useYear } from '@/contexts/year-context';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';
import { ArrowRight, Home, Menu, X } from 'lucide-react';
import { MustacheSVG } from '@/app/_shared/components/mustache-icon';

interface NavigationProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

export function Navigation({ isAuthenticated = false, isAdmin = false }: NavigationProps) {
  const pathname = usePathname();
  const { selectedYear } = useYear();
  const currentEventYear = getCurrentEventYear();
  const [menuOpen, setMenuOpen] = useState(false);

  // Show year selector on pages where it's relevant
  const showYearSelector = ['/galleri', '/deltakere', '/premier', '/'].includes(pathname);

  // Helper to add year parameter to URLs (only if not current year)
  const getUrlWithYear = (path: string) => {
    if (selectedYear !== currentEventYear) {
      return `${path}?year=${selectedYear}`;
    }
    return path;
  };

  if (selectedYear === 2025) {
    return (
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link
              href={getUrlWithYear('/')}
              className="hidden text-xl font-bold text-foreground transition-colors hover:text-accent md:block"
            >
              Barteløpet
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <Link
                href={getUrlWithYear('/galleri')}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Galleri
              </Link>
              <Link
                href={getUrlWithYear('/deltakere')}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Deltakere
              </Link>
              <Link
                href={getUrlWithYear('/premier')}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Premier
              </Link>
              {showYearSelector && <YearSelector variant="compact" />}
              {isAuthenticated && (
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-sm font-semibold text-accent">
                  Admin
                </Link>
              )}
            </div>

            <Link
              href={getUrlWithYear('/')}
              aria-label="Forsiden"
              className="text-muted-foreground transition-colors hover:text-foreground md:hidden"
            >
              <Home size={18} />
            </Link>
            <div className="flex items-center gap-2 md:hidden">
              <Link
                href={getUrlWithYear('/galleri')}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Galleri
              </Link>
              <Link
                href={getUrlWithYear('/deltakere')}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Deltakere
              </Link>
              <Link
                href={getUrlWithYear('/premier')}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Premier
              </Link>
              {showYearSelector && <YearSelector variant="compact" />}
              {isAuthenticated && (
                <Button
                  asChild
                  size="sm"
                  className="h-7 bg-accent px-2 text-xs text-accent-foreground hover:bg-accent/90"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const links = [
    ['Prosjekt SUT', '/#prosjekt-sut'],
    ['Bartelinjen', '/#bartelinjen'],
    ['Løpere', '/deltakere'],
    ['Premier', '/premier'],
  ] as const;
  const primaryAction = isAuthenticated
    ? { label: 'Min side', href: '/dashboard' }
    : { label: 'Bli med', href: '/pamelding' };

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-foreground bg-background/95 backdrop-blur-lg">
      <div className="mx-auto max-w-[1500px] px-4 md:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Barteløpet 2026, til forsiden"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-accent transition-transform group-hover:-rotate-6">
              <MustacheSVG className="h-6 w-8" />
            </span>
            <span className="min-w-0">
              <span className="font-display block text-2xl font-black uppercase leading-none tracking-tight">
                Barteløpet
              </span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.17em] text-muted-foreground sm:block">
                For Prosjekt SUT · 2026
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {links.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                className="border-b-2 border-transparent py-1 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-secondary aria-[current=page]:border-foreground"
              >
                {label}
              </Link>
            ))}

            {showYearSelector && <YearSelector variant="compact" />}

            {isAdmin && (
              <Link href="/admin" className="text-xs font-bold uppercase tracking-wider">
                Admin
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                aria-current={pathname === '/login' ? 'page' : undefined}
                className="border-b-2 border-transparent py-1 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-secondary aria-[current=page]:border-foreground"
              >
                Logg inn
              </Link>
            )}

            <Button asChild variant="cta" size="sm" className="h-10 px-4">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <Button asChild variant="cta" size="sm" className="h-10 px-3 text-xs">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Lukk meny' : 'Åpne meny'}
              className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t-2 border-foreground bg-background lg:hidden">
          <div className="mx-auto grid max-w-[1500px] px-4 py-3 md:px-8">
            {links.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                aria-current={pathname === href ? 'page' : undefined}
                className="font-display flex items-center justify-between border-b border-foreground/20 py-3 text-2xl font-black uppercase aria-[current=page]:text-secondary-ink"
              >
                {label}
                <ArrowRight className="h-5 w-5" />
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="font-display border-b border-foreground/20 py-3 text-2xl font-black uppercase"
              >
                Admin
              </Link>
            )}
            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                aria-current={pathname === '/login' ? 'page' : undefined}
                className="font-display flex items-center justify-between border-b border-foreground/20 py-3 text-2xl font-black uppercase aria-[current=page]:text-secondary-ink"
              >
                Logg inn
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
            {showYearSelector && (
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Utgave
                </span>
                <YearSelector variant="compact" />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
