import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RegistrationForm } from '@/components/registration-form';

export default async function RegistrationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is already authenticated and has a participant record, redirect to dashboard
  if (user) {
    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (participant) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Påmelding</h1>
        <p className="text-lg text-muted-foreground">
          Fyll ut skjemaet under for å melde deg på Barteløpet 2024
        </p>
      </div>

      <RegistrationForm />
    </div>
  );
}
