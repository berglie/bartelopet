'use client';

import Link from 'next/link';
import { Button } from '@/app/_shared/components/ui/button';
import { YearSelector } from './year-selector';
import { usePathname } from 'next/navigation';
import { useYear } from '@/contexts/year-context';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';
import { ArrowUpRight, Home, Mountain } from 'lucide-react';
import { MustacheSVG } from '@/app/_shared/components/mustache-icon';

interface NavigationProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

export function Navigation({ isAuthenticated = false, isAdmin = false }: NavigationProps) {
  const pathname = usePathname();
  const { selectedYear } = useYear();
  const currentEventYear = getCurrentEventYear();

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

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-foreground bg-background/95 backdrop-blur-lg">
      <div className="mx-auto max-w-[1500px] px-4 md:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3" aria-label="Barteløpet 2026">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-accent transition-transform group-hover:-rotate-6">
              <MustacheSVG className="h-6 w-8" />
            </span>
            <span>
              <span className="font-display block text-2xl font-black uppercase leading-none tracking-tight">
                Barteløpet
              </span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.17em] text-muted-foreground sm:block">
                For Prosjekt SUT · 2026
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {[
              ['Prosjekt SUT', '/#prosjekt-sut'],
              ['Bartelinjen', '/#bartelinjen'],
              ['Løpere', '/deltakere'],
              ['Premier', '/premier'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:text-secondary"
              >
                {label}
              </Link>
            ))}

            {showYearSelector && <YearSelector variant="compact" />}

            {isAuthenticated && (
              <Button
                asChild
                className="border-2 border-foreground bg-accent font-bold uppercase tracking-wide text-accent-foreground shadow-[3px_3px_0_hsl(var(--foreground))] hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-accent hover:shadow-none"
              >
                <Link href="/dashboard">Min side</Link>
              </Button>
            )}
            {!isAuthenticated && (
              <Button
                asChild
                className="border-2 border-foreground bg-accent font-bold uppercase tracking-wide text-accent-foreground shadow-[3px_3px_0_hsl(var(--foreground))] hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-accent hover:shadow-none"
              >
                <Link href="/pamelding">Bli med</Link>
              </Button>
            )}
            {isAdmin && (
              <Link href="/admin" className="text-xs font-bold uppercase tracking-wider">
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5 lg:hidden">
            <Link
              href="/#bartelinjen"
              className="hidden p-2 text-xs font-bold uppercase tracking-wider sm:block"
            >
              Linjen
            </Link>
            <Link href="/deltakere" aria-label="Løpere" className="p-2 sm:hidden">
              <Mountain className="h-5 w-5" />
            </Link>
            {showYearSelector && <YearSelector variant="compact" />}
            {isAuthenticated && (
              <Button
                asChild
                size="sm"
                className="h-9 border-2 border-foreground bg-accent px-3 text-xs font-bold uppercase text-accent-foreground"
              >
                <Link href="/dashboard">Min side</Link>
              </Button>
            )}
            {!isAuthenticated && (
              <Button
                asChild
                size="sm"
                className="h-9 border-2 border-foreground bg-accent px-3 text-xs font-bold uppercase text-accent-foreground"
              >
                <Link href="/pamelding">
                  Bli med <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
