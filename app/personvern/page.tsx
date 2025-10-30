import { PrivacyPolicy } from '@/app/_shared/components/PrivacyPolicy'
import { privacyPolicyMetadata } from '@/app/_shared/lib/metadata'

export const metadata = privacyPolicyMetadata

export default function PersonvernPage() {
  return <PrivacyPolicy />
}