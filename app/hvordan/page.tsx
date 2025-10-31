import { howToMetadata } from '@/app/_shared/lib/metadata';
import type { Metadata } from 'next';
import { HvordanClient } from './_components/hvordan-client';

export const metadata: Metadata = howToMetadata;

export default function HvordanPage() {
  return <HvordanClient />;
}
