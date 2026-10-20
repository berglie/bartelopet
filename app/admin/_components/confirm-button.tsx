'use client';

import type { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/app/_shared/components/ui/button';

/** Submit button that asks before running an irreversible server action. */
export function ConfirmButton({
  confirmText,
  children,
  ...props
}: ComponentProps<typeof Button> & { confirmText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {pending ? 'Jobber…' : children}
    </Button>
  );
}
