// Sponsor types for Barteløpet premier page

export type SponsorCategory =
  | 'merchandise' // Companies providing merchandise or prizes
  | 'trophy' // Trophy prize (Metallteknikk)
  | 'donation'; // Companies providing donations

export interface Sponsor {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  category: SponsorCategory;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SponsorPublic {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  category: SponsorCategory;
  contribution?: string;
}

// Grouped sponsors for display
export interface GroupedSponsors {
  merchandise: SponsorPublic[];
  trophy: SponsorPublic[];
  donation: SponsorPublic[];
}
