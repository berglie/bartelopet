import { createClient } from '@/lib/supabase/server';
import { Navigation } from '@/components/navigation';

export async function NavigationWrapper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <Navigation isAuthenticated={!!user} />;
}
