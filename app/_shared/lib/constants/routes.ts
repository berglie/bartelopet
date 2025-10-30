/**
 * Application routes constants
 */

export const routes = {
  home: '/',
  about: '/om',
  
  // Auth routes
  login: '/login',
  authCallback: '/auth-callback',
  logout: '/logout',
  
  // Public routes
  gallery: '/galleri',
  galleryDetail: (id: string) => `/galleri/${id}`,
  participants: '/deltakere',
  participantDetail: (id: string) => `/deltakere/${id}`,
  
  // Protected routes
  registration: '/registrering',
  dashboard: '/dashboard',
  profile: '/profil',
  
  // API routes
  api: {
    participants: '/api/participants',
    participantDetail: (id: string) => `/api/participants/${id}`,
    completions: '/api/completions',
    completionDetail: (id: string) => `/api/completions/${id}`,
    vote: (completionId: string) => `/api/completions/${completionId}/vote`,
    upload: '/api/upload',
    stats: '/api/stats',
  },
} as const;
