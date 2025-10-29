import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

type Completion = {
  completed_date: string;
  duration_text: string | null;
  photo_url: string;
  comment: string | null;
  vote_count: number;
};

export function CompletionDisplay({ completion }: { completion: Completion }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={completion.photo_url}
              alt="Ditt fullførte løp"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Dato</h3>
              <p className="text-lg">
                {new Date(completion.completed_date).toLocaleDateString('nb-NO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {completion.duration_text && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Tid</h3>
                <p className="text-lg">{completion.duration_text}</p>
              </div>
            )}

            {completion.comment && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Kommentar</h3>
                <p className="text-lg">{completion.comment}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Stemmer</h3>
              <p className="text-3xl font-bold text-accent">{completion.vote_count}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
