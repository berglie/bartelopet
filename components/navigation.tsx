'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MustacheSVG } from '@/components/mustache-icon';
import { YearSelector } from '@/components/year-selector';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  isAuthenticated?: boolean;
}

export function Navigation({ isAuthenticated = false }: NavigationProps) {
  const pathname = usePathname();

  // Show year selector on pages where it's relevant
  const showYearSelector = ['/galleri', '/deltakere', '/'].includes(pathname);

  return (
    <nav className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-accent transition-colors group">
            <MustacheSVG className="h-5 w-10 text-accent group-hover:scale-110 transition-transform" />
            <span>Barteløpet</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/galleri" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Galleri
            </Link>
            <Link href="/deltakere" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Deltakere
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
                  <Link href="/send-inn">Send inn løp</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-2">
            {showYearSelector && <YearSelector variant="compact" />}
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href={isAuthenticated ? "/dashboard" : "/send-inn"}>
                {isAuthenticated ? "Dashboard" : "Send inn"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
