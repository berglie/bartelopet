'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { Button } from '@/app/_shared/components/ui/button';
import { Edit, Images as ImagesIcon, Star } from 'lucide-react';
import { EditFieldDialog } from '@/app/dashboard/_components/edit-field-dialog';
import { ManageImagesDialog } from './manage-images-dialog';
import { useRouter } from 'next/navigation';
import { getPhotos } from '@/app/actions/photos';
import type { CompletionImage } from '@/app/_shared/lib/types/database';

type Completion = {
  id: string;
  participant_id: string;
  completed_date: string;
  duration_text: string | null;
  comment: string | null;
  vote_count: number;
  image_count: number;
};

export function CompletionDisplayMulti({ completion }: { completion: Completion }) {
  const router = useRouter();
  const [editingField, setEditingField] = useState<'date' | 'time' | 'comment' | null>(null);
  const [managingImages, setManagingImages] = useState(false);
  const [images, setImages] = useState<CompletionImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  const fetchImages = useCallback(async () => {
    setLoadingImages(true);
    const result = await getPhotos(completion.id);
    if (result.success && result.data) {
      setImages(result.data);
    }
    setLoadingImages(false);
  }, [completion.id]);

  useEffect(() => {
    void fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completion.id]);

  const handleSuccess = () => {
    fetchImages();
    router.refresh();
  };

  const starredImage = images.find((img) => img.is_starred);
  const otherImages = images.filter((img) => !img.is_starred);

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Images Section */}
            <div className="space-y-4">
              {/* Main Starred Image */}
              <div className="group relative aspect-square w-full overflow-hidden rounded-lg border-2 border-accent">
                {loadingImages ? (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground" />
                  </div>
                ) : starredImage ? (
                  <Image
                    src={starredImage.image_url}
                    alt="Hovedbilde fra løpet"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <p className="text-muted-foreground">Ingen bilder</p>
                  </div>
                )}

                {/* Starred badge */}
                {starredImage && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Hovedbilde
                  </div>
                )}

                {/* Manage images button */}
                <Button
                  onClick={() => setManagingImages(true)}
                  size="sm"
                  variant="secondary"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <ImagesIcon className="mr-2 h-4 w-4" />
                  Administrer bilder
                </Button>

                {/* Image count indicator */}
                {images.length > 1 && (
                  <div className="absolute bottom-2 right-2 rounded-full bg-background/90 px-3 py-1 text-sm font-medium text-foreground shadow-lg">
                    {images.length} bilder
                  </div>
                )}
              </div>

              {/* Other Images Thumbnails */}
              {otherImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {otherImages.slice(0, 3).map((image) => (
                    <button
                      key={image.id}
                      onClick={() => setManagingImages(true)}
                      className="relative aspect-square overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-accent"
                    >
                      <Image
                        src={image.image_url}
                        alt="Ekstra bilde"
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}

                  {/* Show "+N more" if there are more than 3 additional images */}
                  {otherImages.length > 3 && (
                    <button
                      onClick={() => setManagingImages(true)}
                      className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-muted transition-colors hover:bg-accent/20"
                    >
                      <span className="text-sm font-medium">+{otherImages.length - 3}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick action button when no thumbnails shown */}
              {images.length === 1 && (
                <Button
                  variant="outline"
                  onClick={() => setManagingImages(true)}
                  className="w-full"
                >
                  <ImagesIcon className="mr-2 h-4 w-4" />
                  Legg til flere bilder
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Date field */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">Dato</h3>
                  <p className="text-lg">
                    {new Date(completion.completed_date).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Button
                  onClick={() => setEditingField('date')}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Time field */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">Tid</h3>
                  <p className="text-lg">{completion.duration_text || 'Ikke angitt'}</p>
                </div>
                <Button
                  onClick={() => setEditingField('time')}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Comment field */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">Kommentar</h3>
                  <p className="text-lg">{completion.comment || 'Ingen kommentar'}</p>
                </div>
                <Button
                  onClick={() => setEditingField('comment')}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Votes (read-only) */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Stemmer</h3>
                <p className="text-3xl font-bold text-accent">{completion.vote_count}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialogs */}
      {editingField && (
        <EditFieldDialog
          isOpen={true}
          onClose={() => setEditingField(null)}
          completion={completion}
          field={editingField}
          onSuccess={handleSuccess}
        />
      )}

      {managingImages && (
        <ManageImagesDialog
          isOpen={true}
          onClose={() => setManagingImages(false)}
          completionId={completion.id}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
