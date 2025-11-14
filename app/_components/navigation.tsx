'use client';

import Link from 'next/link';
import { Button } from '@/app/_shared/components/ui/button';
import { YearSelector } from './year-selector';
import { usePathname } from 'next/navigation';
import { useYear } from '@/contexts/year-context';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';

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
    <nav className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={getUrlWithYear("/")} className="font-bold text-xl text-foreground hover:text-accent transition-colors hidden md:block">
            Barteløpet
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href={getUrlWithYear("/galleri")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Galleri
            </Link>
            <Link href={getUrlWithYear("/deltakere")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Deltakere
            </Link>
            <Link href="/premier" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Premier
            </Link>

            {showYearSelector && <YearSelector variant="compact" />}

            {isAuthenticated ? (
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Logg inn
                </Link>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/pamelding">Påmelding</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu - left side */}
          <div className="md:hidden flex items-center gap-3">
            <Link href={getUrlWithYear("/galleri")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Galleri
            </Link>
            <Link href={getUrlWithYear("/deltakere")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Deltakere
            </Link>
            <Link href="/premier" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Premier
            </Link>
            {showYearSelector && <YearSelector variant="compact" />}
          </div>

          {/* Mobile menu - right side buttons */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/login">Logg inn</Link>
                </Button>
                <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
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
