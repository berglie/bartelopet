'use client';

import Link from 'next/link';
import { Button } from '@/app/_shared/components/ui/button';
import { YearSelector } from './year-selector';
import { usePathname } from 'next/navigation';
import { useYear } from '@/contexts/year-context';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';
import { Home } from 'lucide-react';

interface NavigationProps {
  isAuthenticated?: boolean;
}

export function Navigation({ isAuthenticated = false }: NavigationProps) {
  const pathname = usePathname();
  const { selectedYear } = useYear();
  const currentEventYear = getCurrentEventYear();

  // Show year selector on pages where it's relevant
  const showYearSelector = ['/galleri', '/deltakere', '/'].includes(pathname);

  // Helper to add year parameter to URLs (only if not current year)
  const getUrlWithYear = (path: string) => {
    if (selectedYear !== currentEventYear) {
      return `${path}?year=${selectedYear}`;
    }
    return path;
  };

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
              href="/premier"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Premier
            </Link>

            {showYearSelector && <YearSelector variant="compact" />}

            {isAuthenticated ? (
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Logg inn
                </Link>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/pamelding">Påmelding</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu - home icon only on left */}
          <Link
            href={getUrlWithYear('/')}
            className="text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <Home size={18} />
          </Link>

          {/* Mobile menu - all other links on right */}
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
              href="/premier"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Premier
            </Link>
            {showYearSelector && <YearSelector variant="compact" />}
            {isAuthenticated ? (
              <Button
                asChild
                size="sm"
                className="h-7 bg-accent px-2 text-xs text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="whitespace-nowrap text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Logg inn
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="h-7 bg-accent px-2 text-xs text-accent-foreground hover:bg-accent/90"
                >
                  <Link href="/pamelding">Påmelding</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
