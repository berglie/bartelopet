import { TermsOfService } from '@/app/_shared/components/TermsOfService';
import { termsOfServiceMetadata } from '@/app/_shared/lib/metadata';

export const metadata = termsOfServiceMetadata;

export default function VilkarPage() {
  return <TermsOfService />;
}
