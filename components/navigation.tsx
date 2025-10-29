import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { MustacheSVG } from '@/components/mustache-icon';

export async function Navigation() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
            {user ? (
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
          <div className="md:hidden">
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href={user ? "/dashboard" : "/send-inn"}>
                {user ? "Dashboard" : "Send inn"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
