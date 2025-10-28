# Barteløpet - System Architecture Documentation

**Version:** 1.0
**Date:** 2025-10-28
**Project:** Barteløpet Charity Run Website
**Technology Stack:** Next.js 14 App Router, TypeScript, Supabase
**Language:** Norwegian (nb-NO)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Project Folder Structure](#project-folder-structure)
4. [Component Architecture](#component-architecture)
5. [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces)
6. [Database Schema](#database-schema)
7. [Authentication & Authorization Flow](#authentication--authorization-flow)
8. [File Upload Strategy](#file-upload-strategy)
9. [API Route Structure](#api-route-structure)
10. [State Management Patterns](#state-management-patterns)
11. [Routing Structure](#routing-structure)
12. [Key Technical Decisions](#key-technical-decisions)
13. [Security Considerations](#security-considerations)
14. [Performance Optimization](#performance-optimization)
15. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

Barteløpet is a charity run website that enables participants to register, complete barefoot runs, upload completion photos, and vote for their favorite submissions. The application is built with modern web technologies focusing on mobile-first design, accessibility, and Norwegian language support.

### Core Features
- User registration with magic link authentication
- Run completion tracking and photo uploads
- Community voting system
- Participant dashboard
- Public gallery and leaderboard
- Responsive design with earth tone color palette

### Architecture Principles
- **Mobile-First:** Progressive enhancement from mobile to desktop
- **Type-Safe:** Full TypeScript coverage with strict mode
- **Serverless:** Leverage Next.js 14 App Router and Supabase
- **Scalable:** Component-based architecture with clear separation of concerns
- **Accessible:** WCAG 2.1 AA compliance
- **Performant:** Server-side rendering, image optimization, edge caching

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Browser │  │  Mobile  │  │  Tablet  │  │  Desktop │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
        ┌─────────────────▼─────────────────┐
        │     Next.js 14 App Router         │
        │  ┌─────────────────────────────┐  │
        │  │   Server Components (RSC)   │  │
        │  ├─────────────────────────────┤  │
        │  │   Client Components         │  │
        │  ├─────────────────────────────┤  │
        │  │   API Routes                │  │
        │  ├─────────────────────────────┤  │
        │  │   Server Actions            │  │
        │  └─────────────────────────────┘  │
        └─────────────────┬─────────────────┘
                          │
        ┌─────────────────▼─────────────────┐
        │         Supabase Backend          │
        │  ┌─────────────────────────────┐  │
        │  │   PostgreSQL Database       │  │
        │  ├─────────────────────────────┤  │
        │  │   Authentication (Magic)    │  │
        │  ├─────────────────────────────┤  │
        │  │   Storage (Images)          │  │
        │  ├─────────────────────────────┤  │
        │  │   Real-time Subscriptions   │  │
        │  ├─────────────────────────────┤  │
        │  │   Row Level Security (RLS)  │  │
        │  └─────────────────────────────┘  │
        └───────────────────────────────────┘
```

---

## Project Folder Structure

```
barteløpet/
├── .env.local                          # Environment variables (gitignored)
├── .env.example                        # Environment template
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.js                      # Next.js configuration
├── tsconfig.json                       # TypeScript configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
├── package.json
├── pnpm-lock.yaml
├── README.md
├── ARCHITECTURE.md                     # This document
│
├── public/                             # Static assets
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-background.jpg
│   │   └── placeholder-avatar.png
│   ├── icons/
│   │   └── favicon.ico
│   └── fonts/
│       └── inter-var.woff2
│
├── src/
│   ├── app/                            # Next.js 14 App Router
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── page.tsx                    # Homepage (/)
│   │   ├── globals.css                 # Global styles
│   │   ├── not-found.tsx               # 404 page
│   │   ├── error.tsx                   # Error boundary
│   │   │
│   │   ├── (auth)/                     # Auth route group
│   │   │   ├── layout.tsx              # Auth layout (centered, minimal)
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Login with magic link
│   │   │   ├── auth-callback/
│   │   │   │   └── route.ts            # Handle Supabase callback
│   │   │   └── logout/
│   │   │       └── route.ts            # Logout endpoint
│   │   │
│   │   ├── (public)/                   # Public pages route group
│   │   │   ├── om/
│   │   │   │   └── page.tsx            # About page
│   │   │   ├── galleri/
│   │   │   │   ├── page.tsx            # Gallery grid view
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # Single photo detail
│   │   │   └── deltakere/
│   │   │       ├── page.tsx            # Participants list/leaderboard
│   │   │       └── [id]/
│   │   │           └── page.tsx        # Participant profile
│   │   │
│   │   ├── (protected)/                # Protected routes group
│   │   │   ├── layout.tsx              # Protected layout with auth check
│   │   │   ├── registrering/
│   │   │   │   └── page.tsx            # Registration form
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx            # User dashboard
│   │   │   │   ├── loading.tsx         # Loading skeleton
│   │   │   │   └── components/
│   │   │   │       ├── stats-card.tsx
│   │   │   │       ├── upload-section.tsx
│   │   │   │       └── activity-feed.tsx
│   │   │   └── profil/
│   │   │       ├── page.tsx            # Edit profile
│   │   │       └── components/
│   │   │           ├── profile-form.tsx
│   │   │           └── avatar-upload.tsx
│   │   │
│   │   └── api/                        # API routes
│   │       ├── participants/
│   │       │   ├── route.ts            # GET /api/participants
│   │       │   └── [id]/
│   │       │       ├── route.ts        # GET/PATCH/DELETE
│   │       │       └── completions/
│   │       │           └── route.ts    # POST completion
│   │       ├── completions/
│   │       │   ├── route.ts            # GET /api/completions
│   │       │   └── [id]/
│   │       │       ├── route.ts        # GET/PATCH/DELETE
│   │       │       └── vote/
│   │       │           └── route.ts    # POST/DELETE vote
│   │       ├── votes/
│   │       │   └── route.ts            # GET user votes
│   │       ├── upload/
│   │       │   └── route.ts            # POST image upload
│   │       └── stats/
│   │           └── route.ts            # GET global statistics
│   │
│   ├── components/                     # Shared components
│   │   ├── ui/                         # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── spinner.tsx
│   │   │   └── progress.tsx
│   │   │
│   │   ├── layout/                     # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── navigation.tsx
│   │   │   ├── mobile-menu.tsx
│   │   │   └── sidebar.tsx
│   │   │
│   │   ├── forms/                      # Form components
│   │   │   ├── registration-form.tsx
│   │   │   ├── login-form.tsx
│   │   │   ├── completion-form.tsx
│   │   │   ├── form-field.tsx
│   │   │   ├── form-error.tsx
│   │   │   └── form-success.tsx
│   │   │
│   │   ├── gallery/                    # Gallery components
│   │   │   ├── gallery-grid.tsx
│   │   │   ├── gallery-item.tsx
│   │   │   ├── gallery-filters.tsx
│   │   │   ├── image-modal.tsx
│   │   │   └── vote-button.tsx
│   │   │
│   │   ├── participants/               # Participant components
│   │   │   ├── participant-card.tsx
│   │   │   ├── participant-list.tsx
│   │   │   ├── leaderboard.tsx
│   │   │   └── participant-stats.tsx
│   │   │
│   │   ├── upload/                     # Upload components
│   │   │   ├── image-uploader.tsx
│   │   │   ├── image-preview.tsx
│   │   │   ├── upload-progress.tsx
│   │   │   └── drag-drop-zone.tsx
│   │   │
│   │   └── providers/                  # Context providers
│   │       ├── auth-provider.tsx
│   │       ├── toast-provider.tsx
│   │       └── theme-provider.tsx
│   │
│   ├── lib/                            # Core libraries
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server Supabase client
│   │   │   ├── middleware.ts           # Auth middleware
│   │   │   └── types.ts                # Generated Supabase types
│   │   │
│   │   ├── validations/                # Zod schemas
│   │   │   ├── participant.ts
│   │   │   ├── completion.ts
│   │   │   ├── vote.ts
│   │   │   └── auth.ts
│   │   │
│   │   ├── utils/                      # Utility functions
│   │   │   ├── cn.ts                   # Class name merger
│   │   │   ├── format.ts               # Date/number formatting
│   │   │   ├── image.ts                # Image utilities
│   │   │   └── errors.ts               # Error handling
│   │   │
│   │   └── constants/                  # Constants
│   │       ├── config.ts               # App configuration
│   │       ├── routes.ts               # Route definitions
│   │       └── messages.ts             # Norwegian UI messages
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── use-auth.ts                 # Authentication hook
│   │   ├── use-participants.ts         # Participants data hook
│   │   ├── use-completions.ts          # Completions data hook
│   │   ├── use-votes.ts                # Voting hook
│   │   ├── use-upload.ts               # File upload hook
│   │   ├── use-toast.ts                # Toast notifications
│   │   ├── use-media-query.ts          # Responsive breakpoints
│   │   └── use-debounce.ts             # Debounce utility
│   │
│   ├── types/                          # TypeScript types
│   │   ├── index.ts                    # Main type exports
│   │   ├── participant.ts              # Participant types
│   │   ├── completion.ts               # Completion types
│   │   ├── vote.ts                     # Vote types
│   │   ├── api.ts                      # API response types
│   │   └── ui.ts                       # UI component types
│   │
│   ├── styles/                         # Additional styles
│   │   ├── variables.css               # CSS variables
│   │   └── utilities.css               # Tailwind utilities
│   │
│   └── middleware.ts                   # Next.js middleware (auth)
│
├── supabase/                           # Supabase configuration
│   ├── migrations/                     # Database migrations
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250101000001_rls_policies.sql
│   │   └── 20250101000002_storage_buckets.sql
│   │
│   ├── seed.sql                        # Seed data for development
│   └── config.toml                     # Supabase CLI config
│
└── tests/                              # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## Component Architecture

### Component Hierarchy

```
App (layout.tsx)
│
├── Providers (AuthProvider, ToastProvider)
│   │
│   ├── Header
│   │   ├── Navigation
│   │   │   ├── NavLinks
│   │   │   └── UserMenu
│   │   └── MobileMenu
│   │
│   ├── Page Content (Dynamic)
│   │   │
│   │   ├── Homepage
│   │   │   ├── Hero Section
│   │   │   ├── Stats Section
│   │   │   ├── Featured Gallery
│   │   │   └── CTA Section
│   │   │
│   │   ├── Registration Page
│   │   │   └── RegistrationForm
│   │   │       ├── FormField[]
│   │   │       ├── FormError
│   │   │       └── Button
│   │   │
│   │   ├── Dashboard Page
│   │   │   ├── StatsCard[]
│   │   │   ├── UploadSection
│   │   │   │   ├── ImageUploader
│   │   │   │   │   ├── DragDropZone
│   │   │   │   │   ├── ImagePreview
│   │   │   │   │   └── UploadProgress
│   │   │   │   └── CompletionForm
│   │   │   └── ActivityFeed
│   │   │
│   │   ├── Gallery Page
│   │   │   ├── GalleryFilters
│   │   │   ├── GalleryGrid
│   │   │   │   └── GalleryItem[]
│   │   │   │       ├── Image
│   │   │   │       ├── VoteButton
│   │   │   │       └── ParticipantInfo
│   │   │   └── ImageModal
│   │   │
│   │   └── Participants Page
│   │       ├── Leaderboard
│   │       │   └── ParticipantCard[]
│   │       └── ParticipantList
│   │           └── ParticipantCard[]
│   │
│   └── Footer
│       ├── FooterLinks
│       └── SocialLinks
```

### Component Design Principles

#### 1. **Server vs Client Components**

**Server Components (Default):**
- All components by default
- Data fetching
- Static content
- Layouts
- SEO-critical content

**Client Components ('use client'):**
- Interactive components (buttons with state, forms)
- Hooks usage (useState, useEffect, custom hooks)
- Browser APIs
- Event handlers
- Real-time subscriptions

#### 2. **Component Categories**

**Presentation Components:**
- Pure, stateless components
- Receive data via props
- No business logic
- Highly reusable
- Examples: Button, Card, Badge, Avatar

**Container Components:**
- Manage state and data fetching
- Connect to hooks and context
- Pass data to presentation components
- Examples: RegistrationForm, GalleryGrid, Dashboard

**Layout Components:**
- Structure and composition
- Wrap other components
- Handle responsive behavior
- Examples: Header, Footer, Sidebar

**Feature Components:**
- Encapsulate specific features
- May include multiple sub-components
- Examples: ImageUploader, VoteButton, Leaderboard

#### 3. **Component Props Pattern**

```typescript
// Base component props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Specific component props extend base
interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}
```

#### 4. **Reusability Strategy**

**UI Components (`components/ui/`):**
- Atomic, highly reusable
- No business logic
- Style variants via props
- Accessible by default (ARIA)

**Feature Components:**
- Composed of UI components
- Include business logic
- Specific to use case
- Can be reused across pages

**Page Components:**
- Route-specific
- Compose feature components
- Handle data fetching
- Minimal logic (delegate to features)

---

## Data Models & TypeScript Interfaces

### Core Entities

```typescript
// types/participant.ts

export interface Participant {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  target_distance_km: number;
  current_distance_km: number;
  total_completions: number;
  total_votes_received: number;
  is_active: boolean;
  user_id: string; // Supabase auth user ID
}

export interface ParticipantCreate {
  email: string;
  full_name: string;
  display_name?: string;
  target_distance_km: number;
}

export interface ParticipantUpdate {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  target_distance_km?: number;
}

export interface ParticipantPublic {
  id: string;
  display_name: string;
  avatar_url: string | null;
  current_distance_km: number;
  total_completions: number;
  total_votes_received: number;
}
```

```typescript
// types/completion.ts

export interface Completion {
  id: string;
  created_at: string;
  updated_at: string;
  participant_id: string;
  distance_km: number;
  duration_minutes: number | null;
  location: string | null;
  notes: string | null;
  image_url: string;
  thumbnail_url: string;
  vote_count: number;
  is_featured: boolean;
  completed_at: string;

  // Relationships
  participant?: ParticipantPublic;
  votes?: Vote[];
}

export interface CompletionCreate {
  participant_id: string;
  distance_km: number;
  duration_minutes?: number;
  location?: string;
  notes?: string;
  image_url: string;
  thumbnail_url: string;
  completed_at: string;
}

export interface CompletionUpdate {
  distance_km?: number;
  duration_minutes?: number;
  location?: string;
  notes?: string;
  is_featured?: boolean;
}

export interface CompletionWithParticipant extends Completion {
  participant: ParticipantPublic;
}
```

```typescript
// types/vote.ts

export interface Vote {
  id: string;
  created_at: string;
  participant_id: string;
  completion_id: string;

  // Relationships
  completion?: Completion;
}

export interface VoteCreate {
  completion_id: string;
}

export interface VoteStats {
  total_votes: number;
  user_has_voted: boolean;
}
```

### API Response Types

```typescript
// types/api.ts

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  total?: number;
  page?: number;
  per_page?: number;
  has_more?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Specific API responses
export interface ParticipantStatsResponse {
  total_participants: number;
  total_distance_km: number;
  total_completions: number;
  total_votes: number;
}

export interface LeaderboardResponse {
  by_distance: ParticipantPublic[];
  by_votes: ParticipantPublic[];
  by_completions: ParticipantPublic[];
}
```

### Form State Types

```typescript
// types/ui.ts

export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface UploadState {
  file: File | null;
  preview: string | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error: string | null;
}

export interface ToastState {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}
```

### Validation Schemas (Zod)

```typescript
// lib/validations/participant.ts

import { z } from 'zod';

export const participantCreateSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  full_name: z.string().min(2, 'Navn må være minst 2 tegn').max(100),
  display_name: z.string().max(50).optional(),
  target_distance_km: z.number().min(1).max(1000),
});

export const participantUpdateSchema = z.object({
  display_name: z.string().max(50).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  target_distance_km: z.number().min(1).max(1000).optional(),
});

export type ParticipantCreateInput = z.infer<typeof participantCreateSchema>;
export type ParticipantUpdateInput = z.infer<typeof participantUpdateSchema>;
```

```typescript
// lib/validations/completion.ts

import { z } from 'zod';

export const completionCreateSchema = z.object({
  distance_km: z.number().min(0.1).max(100),
  duration_minutes: z.number().min(1).max(1000).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  completed_at: z.string().datetime(),
});

export type CompletionCreateInput = z.infer<typeof completionCreateSchema>;
```

---

## Database Schema

### ERD (Entity Relationship Diagram)

```
┌─────────────────────────┐
│      auth.users         │  (Supabase Auth)
│─────────────────────────│
│ id (uuid) PK            │
│ email                   │
│ created_at              │
└───────────┬─────────────┘
            │ 1
            │
            │ 1
┌───────────▼─────────────┐
│     participants        │
│─────────────────────────│
│ id (uuid) PK            │
│ user_id (uuid) FK       │◄──── Foreign Key to auth.users
│ email                   │
│ full_name               │
│ display_name            │
│ avatar_url              │
│ bio                     │
│ target_distance_km      │
│ current_distance_km     │
│ total_completions       │
│ total_votes_received    │
│ is_active               │
│ created_at              │
│ updated_at              │
└───────────┬─────────────┘
            │ 1
            │
            │ *
┌───────────▼─────────────┐
│      completions        │
│─────────────────────────│
│ id (uuid) PK            │
│ participant_id (uuid) FK│
│ distance_km             │
│ duration_minutes        │
│ location                │
│ notes                   │
│ image_url               │
│ thumbnail_url           │
│ vote_count              │
│ is_featured             │
│ completed_at            │
│ created_at              │
│ updated_at              │
└───────────┬─────────────┘
            │ 1
            │
            │ *
┌───────────▼─────────────┐
│         votes           │
│─────────────────────────│
│ id (uuid) PK            │
│ participant_id (uuid) FK│
│ completion_id (uuid) FK │
│ created_at              │
│─────────────────────────│
│ UNIQUE(participant_id,  │
│        completion_id)   │
└─────────────────────────┘
```

### SQL Schema

```sql
-- supabase/migrations/20250101000000_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  target_distance_km NUMERIC(6,2) NOT NULL DEFAULT 10,
  current_distance_km NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_completions INTEGER NOT NULL DEFAULT 0,
  total_votes_received INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create completions table
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  distance_km NUMERIC(5,2) NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  notes TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  completion_id UUID REFERENCES completions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id, completion_id)
);

-- Create indexes
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_is_active ON participants(is_active);
CREATE INDEX idx_completions_participant_id ON completions(participant_id);
CREATE INDEX idx_completions_created_at ON completions(created_at DESC);
CREATE INDEX idx_completions_vote_count ON completions(vote_count DESC);
CREATE INDEX idx_completions_is_featured ON completions(is_featured);
CREATE INDEX idx_votes_participant_id ON votes(participant_id);
CREATE INDEX idx_votes_completion_id ON votes(completion_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_completions_updated_at
  BEFORE UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update participant stats
CREATE OR REPLACE FUNCTION update_participant_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update on new completion
    UPDATE participants
    SET
      current_distance_km = current_distance_km + NEW.distance_km,
      total_completions = total_completions + 1
    WHERE id = NEW.participant_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update on completion deletion
    UPDATE participants
    SET
      current_distance_km = GREATEST(0, current_distance_km - OLD.distance_km),
      total_completions = GREATEST(0, total_completions - 1)
    WHERE id = OLD.participant_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update on completion distance change
    UPDATE participants
    SET current_distance_km = current_distance_km - OLD.distance_km + NEW.distance_km
    WHERE id = NEW.participant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to update participant stats
CREATE TRIGGER update_participant_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_stats();

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment vote count on completion
    UPDATE completions
    SET vote_count = vote_count + 1
    WHERE id = NEW.completion_id;

    -- Increment total votes received on participant
    UPDATE participants
    SET total_votes_received = total_votes_received + 1
    WHERE id = (SELECT participant_id FROM completions WHERE id = NEW.completion_id);

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement vote count on completion
    UPDATE completions
    SET vote_count = GREATEST(0, vote_count - 1)
    WHERE id = OLD.completion_id;

    -- Decrement total votes received on participant
    UPDATE participants
    SET total_votes_received = GREATEST(0, total_votes_received - 1)
    WHERE id = (SELECT participant_id FROM completions WHERE id = OLD.completion_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to update vote counts
CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();
```

### Row Level Security (RLS)

```sql
-- supabase/migrations/20250101000001_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Public can view active participants"
  ON participants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own participant record"
  ON participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participant record"
  ON participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant record"
  ON participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Completions policies
CREATE POLICY "Public can view completions"
  ON completions FOR SELECT
  USING (true);

CREATE POLICY "Participants can insert their own completions"
  ON completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = completion_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update their own completions"
  ON completions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can delete their own completions"
  ON completions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

-- Votes policies
CREATE POLICY "Users can view all votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Participants can insert votes"
  ON votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can delete their own votes"
  ON votes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );
```

### Storage Buckets

```sql
-- supabase/migrations/20250101000002_storage_buckets.sql

-- Create storage bucket for completion images
INSERT INTO storage.buckets (id, name, public)
VALUES ('completions', 'completions', true);

-- Create storage bucket for participant avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Completion images policies
CREATE POLICY "Public can view completion images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'completions');

CREATE POLICY "Authenticated users can upload completion images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'completions'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own completion images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'completions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own completion images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'completions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatar images policies
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Authentication & Authorization Flow

### Magic Link Authentication Flow

```
User Journey:
1. User visits /login
2. User enters email address
3. System sends magic link to email
4. User clicks magic link
5. User redirected to /auth-callback
6. System validates token and creates session
7. User redirected to /dashboard
```

### Detailed Flow Diagram

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Browser │                │ Next.js │                │Supabase │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │  GET /login              │                          │
     ├─────────────────────────►│                          │
     │                          │                          │
     │  LoginForm               │                          │
     │◄─────────────────────────┤                          │
     │                          │                          │
     │  POST email              │                          │
     ├─────────────────────────►│                          │
     │                          │                          │
     │                          │ signInWithOtp()          │
     │                          ├─────────────────────────►│
     │                          │                          │
     │                          │ Magic link sent          │
     │                          │◄─────────────────────────┤
     │                          │                          │
     │  Success message         │                          │
     │◄─────────────────────────┤                          │
     │                          │                          │
     │  User clicks email link  │                          │
     │                          │                          │
     │  GET /auth-callback?token│                          │
     ├─────────────────────────►│                          │
     │                          │                          │
     │                          │ exchangeCodeForSession() │
     │                          ├─────────────────────────►│
     │                          │                          │
     │                          │ Session created          │
     │                          │◄─────────────────────────┤
     │                          │                          │
     │                          │ Check if participant     │
     │                          │ exists in DB             │
     │                          ├─────────────────────────►│
     │                          │                          │
     │                          │ Participant data         │
     │                          │◄─────────────────────────┤
     │                          │                          │
     │  Redirect to appropriate │                          │
     │  page (dashboard or reg) │                          │
     │◄─────────────────────────┤                          │
     │                          │                          │
```

### Implementation

```typescript
// app/(auth)/login/page.tsx

'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth-callback`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Sjekk e-posten din',
        description: 'Vi har sendt deg en innloggingslenke.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Noe gikk galt',
        description: 'Kunne ikke sende innloggingslenke.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <Input
        type="email"
        placeholder="din@epost.no"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" loading={loading}>
        Send innloggingslenke
      </Button>
    </form>
  );
}
```

```typescript
// app/(auth)/auth-callback/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code);

    // Check if user has completed registration
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Redirect to registration if no participant record
      if (!participant) {
        return NextResponse.redirect(new URL('/registrering', requestUrl.origin));
      }
    }
  }

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}
```

```typescript
// middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard') ||
      req.nextUrl.pathname.startsWith('/registrering') ||
      req.nextUrl.pathname.startsWith('/profil')) {

    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Auth routes (redirect if already logged in)
  if (req.nextUrl.pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/registrering/:path*', '/profil/:path*', '/login'],
};
```

### Authorization Patterns

**1. Component-Level Auth:**

```typescript
// hooks/use-auth.ts

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import type { Participant } from '@/types/participant';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: participant } = await supabase
          .from('participants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setParticipant(participant);
      }

      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, participant, loading };
}
```

**2. Server-Side Auth:**

```typescript
// lib/supabase/server.ts

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getServerAuth() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { user: null, participant: null };
  }

  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  return { user: session.user, participant };
}
```

---

## File Upload Strategy

### Architecture Overview

```
Client                     Next.js API              Supabase Storage
┌──────────┐              ┌──────────┐              ┌──────────┐
│ Image    │              │ Upload   │              │ Storage  │
│ Uploader │─────────────►│ Route    │─────────────►│ Bucket   │
│          │              │          │              │          │
│ - Select │              │ - Validate│              │ - Store  │
│ - Preview│              │ - Resize │              │ - Serve  │
│ - Upload │              │ - Upload │              │          │
└──────────┘              └──────────┘              └──────────┘
```

### Upload Flow

1. **Client-Side:**
   - User selects image file
   - Validate file type (JPEG, PNG, WebP)
   - Validate file size (max 10MB)
   - Generate preview
   - Show upload progress

2. **API Route:**
   - Receive FormData
   - Validate authentication
   - Validate image (type, size)
   - Generate unique filename
   - Create thumbnail (400x400)
   - Upload original to Supabase Storage
   - Upload thumbnail to Supabase Storage
   - Return URLs

3. **Storage:**
   - Store in organized folder structure
   - Apply RLS policies
   - Serve via CDN

### Implementation

```typescript
// components/upload/image-uploader.tsx

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ImageUploaderProps {
  onUploadComplete: (imageUrl: string, thumbnailUrl: string) => void;
}

export function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Filen er for stor',
        description: 'Maksimal filstørrelse er 10MB',
        variant: 'error',
      });
      return;
    }

    setFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress (actual progress tracking requires custom implementation)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { imageUrl, thumbnailUrl } = await response.json();

      onUploadComplete(imageUrl, thumbnailUrl);

      toast({
        title: 'Bilde lastet opp',
        description: 'Bildet ditt er nå tilgjengelig',
        variant: 'success',
      });

      // Reset
      setFile(null);
      setPreview(null);
      setProgress(0);
    } catch (error) {
      toast({
        title: 'Opplasting feilet',
        description: 'Kunne ikke laste opp bildet',
        variant: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70"
            disabled={uploading}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {uploading && (
          <Progress value={progress} />
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            loading={uploading}
            className="flex-1"
          >
            {uploading ? 'Laster opp...' : 'Last opp'}
          </Button>
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={uploading}
          >
            Avbryt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="text-sm text-gray-600 mb-2">
        {isDragActive
          ? 'Slipp bildet her...'
          : 'Dra og slipp et bilde her, eller klikk for å velge'}
      </p>
      <p className="text-xs text-gray-500">
        JPG, PNG eller WebP (maks 10MB)
      </p>
    </div>
  );
}
```

```typescript
// app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const fileId = nanoid();
    const ext = file.type.split('/')[1];
    const filename = `${fileId}.${ext}`;
    const thumbnailFilename = `${fileId}_thumb.${ext}`;

    // Process images with Sharp
    const [processedImage, thumbnail] = await Promise.all([
      // Original image (max 1920px width, maintain aspect ratio)
      sharp(buffer)
        .resize(1920, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer(),

      // Thumbnail (400x400 cover)
      sharp(buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer(),
    ]);

    // Upload to Supabase Storage
    const [imageUpload, thumbnailUpload] = await Promise.all([
      supabase.storage
        .from('completions')
        .upload(`${user.id}/${filename}`, processedImage, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        }),

      supabase.storage
        .from('completions')
        .upload(`${user.id}/${thumbnailFilename}`, thumbnail, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        }),
    ]);

    if (imageUpload.error) throw imageUpload.error;
    if (thumbnailUpload.error) throw thumbnailUpload.error;

    // Get public URLs
    const { data: imageUrl } = supabase.storage
      .from('completions')
      .getPublicUrl(`${user.id}/${filename}`);

    const { data: thumbnailUrl } = supabase.storage
      .from('completions')
      .getPublicUrl(`${user.id}/${thumbnailFilename}`);

    return NextResponse.json({
      imageUrl: imageUrl.publicUrl,
      thumbnailUrl: thumbnailUrl.publicUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### Storage Organization

```
completions/
├── {user_id}/
│   ├── {file_id}.jpg              # Original image
│   ├── {file_id}_thumb.jpg        # Thumbnail
│   └── ...

avatars/
├── {user_id}/
│   ├── avatar.jpg
│   └── ...
```

### Image Optimization Strategy

1. **Resize on upload** (Sharp library)
   - Original: Max 1920px width, maintain aspect ratio
   - Thumbnail: 400x400 cover crop

2. **Format conversion**
   - Convert all to JPEG for consistency
   - Quality: 85 for original, 80 for thumbnail

3. **Next.js Image component**
   - Automatic optimization
   - Lazy loading
   - Responsive sizes

4. **CDN caching**
   - Supabase Storage CDN
   - Cache-Control headers

---

## API Route Structure

### REST API Endpoints

```
/api
├── /participants
│   ├── GET     - List all active participants (public)
│   ├── POST    - Create participant (protected)
│   │
│   └── /[id]
│       ├── GET    - Get participant details
│       ├── PATCH  - Update participant (owner only)
│       ├── DELETE - Soft delete participant (owner only)
│       │
│       └── /completions
│           └── POST - Create completion for participant
│
├── /completions
│   ├── GET     - List completions with filters
│   │
│   └── /[id]
│       ├── GET    - Get completion details
│       ├── PATCH  - Update completion (owner only)
│       ├── DELETE - Delete completion (owner only)
│       │
│       └── /vote
│           ├── POST   - Add vote
│           └── DELETE - Remove vote
│
├── /votes
│   └── GET     - Get user's votes
│
├── /upload
│   └── POST    - Upload image
│
└── /stats
    └── GET     - Global statistics
```

### Example API Implementation

```typescript
// app/api/participants/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { participantCreateSchema } from '@/lib/validations/participant';

// GET /api/participants
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '20');
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  try {
    const { data, error, count } = await supabase
      .from('participants')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data,
      meta: {
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count || 0) / perPage),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST /api/participants
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    const validatedData = participantCreateSchema.parse(body);

    // Check if participant already exists
    const { data: existing } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Participant already exists' },
        { status: 400 }
      );
    }

    // Create participant
    const { data, error } = await supabase
      .from('participants')
      .insert({
        user_id: user.id,
        email: validatedData.email,
        full_name: validatedData.full_name,
        display_name: validatedData.display_name,
        target_distance_km: validatedData.target_distance_km,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create participant' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/completions/[id]/vote/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RouteContext {
  params: { id: string };
}

// POST /api/completions/[id]/vote
export async function POST(request: NextRequest, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get participant ID
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Check if completion exists
    const { data: completion } = await supabase
      .from('completions')
      .select('id, participant_id')
      .eq('id', params.id)
      .single();

    if (!completion) {
      return NextResponse.json(
        { error: 'Completion not found' },
        { status: 404 }
      );
    }

    // Prevent self-voting
    if (completion.participant_id === participant.id) {
      return NextResponse.json(
        { error: 'Cannot vote for your own completion' },
        { status: 400 }
      );
    }

    // Create vote (will fail if already voted due to unique constraint)
    const { error } = await supabase.from('votes').insert({
      participant_id: participant.id,
      completion_id: params.id,
    });

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'Already voted' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}

// DELETE /api/completions/[id]/vote
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get participant ID
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Delete vote
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('participant_id', participant.id)
      .eq('completion_id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
```

### API Response Format

All API responses follow a consistent format:

```typescript
// Success response
{
  "data": { /* ... */ },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  }
}

// Error response
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional */ }
}
```

---

## State Management Patterns

### Strategy

**Primary Approach:** Server-side state with React Server Components

**Client-side State:** React hooks + Context API for UI state only

**Rationale:**
- Minimize client-side JavaScript
- Leverage Next.js App Router data fetching
- Simplify state management
- Improve SEO and initial load time

### State Categories

#### 1. Server State (Data from Database)

Managed by React Server Components and Next.js caching:

```typescript
// app/galleri/page.tsx (Server Component)

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GalleryGrid } from '@/components/gallery/gallery-grid';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function GalleryPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: completions } = await supabase
    .from('completions')
    .select(`
      *,
      participant:participants (
        id,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  return <GalleryGrid completions={completions || []} />;
}
```

#### 2. Client State (UI Interactions)

Managed by React hooks for local component state:

```typescript
// components/gallery/gallery-filters.tsx

'use client';

import { useState } from 'react';

interface GalleryFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

export function GalleryFilters({ onFilterChange }: GalleryFiltersProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [showFeatured, setShowFeatured] = useState(false);

  // ... filter UI
}
```

#### 3. Global UI State (Shared Across Components)

Managed by Context API for global UI state:

```typescript
// components/providers/toast-provider.tsx

'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/ui/toast';
import type { ToastState } from '@/types/ui';

interface ToastContextValue {
  toast: (toast: Omit<ToastState, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = useCallback((toast: Omit<ToastState, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto dismiss
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, toast.duration || 5000);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
```

#### 4. Authentication State

Managed by custom hook with Supabase:

```typescript
// components/providers/auth-provider.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import type { Participant } from '@/types/participant';

interface AuthContextValue {
  user: User | null;
  participant: Participant | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: participant } = await supabase
          .from('participants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setParticipant(participant);
      }

      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: participant } = await supabase
          .from('participants')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        setParticipant(participant);
      } else {
        setParticipant(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setParticipant(null);
  };

  return (
    <AuthContext.Provider value={{ user, participant, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Custom Hooks for Data Fetching

```typescript
// hooks/use-participants.ts

'use client';

import { useState, useEffect } from 'react';
import type { ParticipantPublic } from '@/types/participant';

interface UseParticipantsOptions {
  sortBy?: 'distance' | 'votes' | 'completions';
  limit?: number;
}

export function useParticipants(options: UseParticipantsOptions = {}) {
  const [participants, setParticipants] = useState<ParticipantPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const params = new URLSearchParams();
        if (options.sortBy) params.set('sort_by', `total_${options.sortBy}`);
        if (options.limit) params.set('per_page', options.limit.toString());

        const response = await fetch(`/api/participants?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');

        const { data } = await response.json();
        setParticipants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [options.sortBy, options.limit]);

  return { participants, loading, error };
}
```

### State Management Best Practices

1. **Prefer Server Components**
   - Fetch data on the server when possible
   - Reduce client-side JavaScript
   - Improve SEO

2. **Use Client Components for Interactivity**
   - Forms
   - Interactive UI elements
   - Real-time features

3. **Minimize Global State**
   - Only for truly global UI state
   - Auth state
   - Toast notifications

4. **Keep State Close to Usage**
   - Avoid prop drilling
   - Co-locate state with components

5. **Cache Strategies**
   - Use Next.js built-in caching
   - Implement revalidation
   - Use Supabase real-time for live updates

---

## Routing Structure

### App Router Structure

```
/                           → Homepage (public)
/om                         → About page (public)
/login                      → Login with magic link (public, redirects if authenticated)
/auth-callback              → Auth callback handler

/galleri                    → Gallery grid view (public)
/galleri/[id]               → Single photo detail (public)

/deltakere                  → Participants list/leaderboard (public)
/deltakere/[id]             → Participant profile (public)

/registrering               → Registration form (protected)
/dashboard                  → User dashboard (protected)
/profil                     → Edit profile (protected)
```

### Route Groups

```typescript
// Route group: (auth) - Authentication pages
(auth)/
├── layout.tsx              # Minimal centered layout
├── login/
└── auth-callback/

// Route group: (public) - Public pages
(public)/
├── om/
├── galleri/
└── deltakere/

// Route group: (protected) - Protected pages
(protected)/
├── layout.tsx              # Layout with auth check
├── registrering/
├── dashboard/
└── profil/
```

### Dynamic Routes

```typescript
// app/galleri/[id]/page.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ImageModal } from '@/components/gallery/image-modal';

interface PageProps {
  params: { id: string };
}

export default async function CompletionDetailPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies });

  const { data: completion } = await supabase
    .from('completions')
    .select(`
      *,
      participant:participants (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('id', params.id)
    .single();

  if (!completion) {
    notFound();
  }

  return <ImageModal completion={completion} />;
}

// Generate static params for static generation
export async function generateStaticParams() {
  const supabase = createServerComponentClient({ cookies });

  const { data: completions } = await supabase
    .from('completions')
    .select('id')
    .limit(100);

  return (completions || []).map((completion) => ({
    id: completion.id,
  }));
}
```

### Navigation Components

```typescript
// components/layout/navigation.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const publicLinks = [
  { href: '/', label: 'Hjem' },
  { href: '/galleri', label: 'Galleri' },
  { href: '/deltakere', label: 'Deltakere' },
  { href: '/om', label: 'Om' },
];

const protectedLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profil', label: 'Profil' },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <nav>
      <ul className="flex gap-4">
        {publicLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={pathname === link.href ? 'active' : ''}
            >
              {link.label}
            </Link>
          </li>
        ))}

        {user && protectedLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={pathname === link.href ? 'active' : ''}
            >
              {link.label}
            </Link>
          </li>
        ))}

        {user ? (
          <li>
            <button onClick={signOut}>Logg ut</button>
          </li>
        ) : (
          <li>
            <Link href="/login">Logg inn</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
```

### Parallel Routes & Intercepting Routes

For advanced UX (modal on gallery):

```
app/
└── galleri/
    ├── page.tsx
    ├── @modal/
    │   └── (.)@id]/
    │       └── page.tsx       # Intercepting route (modal)
    └── [id]/
        └── page.tsx           # Full page view
```

---

## Key Technical Decisions

### 1. Next.js 14 App Router

**Decision:** Use Next.js 14 App Router with React Server Components

**Rationale:**
- Modern React architecture
- Server-first data fetching
- Improved performance (smaller client bundles)
- Better SEO
- Streaming and Suspense support
- Simplified routing

**Trade-offs:**
- Learning curve for new patterns
- Some libraries not yet compatible with RSC

---

### 2. Supabase for Backend

**Decision:** Use Supabase for authentication, database, and storage

**Rationale:**
- Fully managed PostgreSQL database
- Built-in authentication with magic links
- Real-time capabilities
- Generous free tier
- Excellent Next.js integration
- Row Level Security for authorization
- CDN for file storage

**Trade-offs:**
- Vendor lock-in
- Limited customization compared to custom backend

---

### 3. TypeScript Strict Mode

**Decision:** Enable TypeScript strict mode throughout the project

**Rationale:**
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Easier refactoring
- Improved maintainability

**Trade-offs:**
- More upfront work
- Stricter type annotations required

---

### 4. Tailwind CSS for Styling

**Decision:** Use Tailwind CSS with earth tone design system

**Rationale:**
- Utility-first approach
- Rapid prototyping
- Consistent design system
- Small production bundle (purged)
- Excellent mobile-first support
- Dark mode support built-in

**Trade-offs:**
- Verbose className strings
- Initial learning curve

**Color Palette:**
```javascript
// tailwind.config.ts
const colors = {
  primary: {
    50: '#f5f3f0',
    100: '#e8e3dc',
    200: '#d4c9ba',
    300: '#bba892',
    400: '#a28b6f',
    500: '#8c7355',
    600: '#705d46',
    700: '#5a4a3a',
    800: '#4a3e32',
    900: '#3f352c',
  },
  accent: {
    50: '#f0f7f4',
    100: '#dbeee5',
    200: '#b7ddcb',
    300: '#8bc5ab',
    400: '#60a788',
    500: '#42896f',
    600: '#316d59',
    700: '#295749',
    800: '#23463b',
    900: '#1f3a32',
  },
};
```

---

### 5. Server Components by Default

**Decision:** Use React Server Components by default, 'use client' only when necessary

**Rationale:**
- Reduce client-side JavaScript
- Better performance
- Improved SEO
- Simplified data fetching
- Lower data transfer

**When to use 'use client':**
- Interactive components (forms, buttons)
- Hooks (useState, useEffect, custom hooks)
- Browser APIs
- Event handlers

---

### 6. Zod for Validation

**Decision:** Use Zod for schema validation on both client and server

**Rationale:**
- Type-safe validation
- Single source of truth
- Runtime type checking
- Excellent TypeScript integration
- Clear error messages

---

### 7. Image Processing with Sharp

**Decision:** Process images on upload with Sharp library

**Rationale:**
- Resize images to manageable sizes
- Generate thumbnails
- Consistent format (JPEG)
- Reduce storage costs
- Improve load times

---

### 8. Progressive Enhancement

**Decision:** Build with progressive enhancement in mind

**Rationale:**
- Works without JavaScript
- Better accessibility
- SEO benefits
- Resilient to errors

**Implementation:**
- Forms work with native HTML
- Server actions for form handling
- Client-side enhancement for UX

---

### 9. Norwegian Language First

**Decision:** Build UI in Norwegian (nb-NO) from the start

**Rationale:**
- Target audience is Norwegian
- Better user experience
- Easier than retrofitting later
- Consistent terminology

**Implementation:**
```typescript
// lib/constants/messages.ts

export const messages = {
  auth: {
    loginTitle: 'Logg inn',
    emailPlaceholder: 'din@epost.no',
    sendMagicLink: 'Send innloggingslenke',
    checkEmail: 'Sjekk e-posten din',
    magicLinkSent: 'Vi har sendt deg en innloggingslenke.',
  },
  registration: {
    title: 'Registrer deg',
    fullName: 'Fullt navn',
    displayName: 'Visningsnavn (valgfritt)',
    targetDistance: 'Målsatt distanse (km)',
    submit: 'Registrer',
  },
  dashboard: {
    title: 'Dashboard',
    stats: 'Statistikk',
    completions: 'Gjennomføringer',
    uploadPhoto: 'Last opp bilde',
  },
  gallery: {
    title: 'Galleri',
    filterBy: 'Filtrer',
    sortBy: 'Sorter',
    recent: 'Nyeste',
    popular: 'Populære',
    vote: 'Stem',
    voted: 'Stemt',
  },
  participants: {
    title: 'Deltakere',
    leaderboard: 'Toppliste',
    byDistance: 'Etter distanse',
    byVotes: 'Etter stemmer',
    byCompletions: 'Etter gjennomføringer',
  },
  common: {
    loading: 'Laster...',
    error: 'Noe gikk galt',
    success: 'Suksess',
    cancel: 'Avbryt',
    save: 'Lagre',
    delete: 'Slett',
    edit: 'Rediger',
    back: 'Tilbake',
  },
};
```

---

## Security Considerations

### 1. Authentication Security

- **Magic Link Authentication:** Secure, passwordless authentication
- **Session Management:** HTTP-only cookies managed by Supabase
- **Token Refresh:** Automatic token refresh
- **CSRF Protection:** Built into Next.js

### 2. Authorization

- **Row Level Security (RLS):** Enforce access control at database level
- **Middleware Protection:** Protect routes with Next.js middleware
- **API Route Guards:** Verify authentication in API routes
- **Owner Checks:** Ensure users can only modify their own data

### 3. Input Validation

- **Client-Side:** Zod validation for immediate feedback
- **Server-Side:** Zod validation to prevent malicious requests
- **SQL Injection:** Protected by Supabase parameterized queries
- **XSS:** React automatically escapes content

### 4. File Upload Security

- **File Type Validation:** Only allow image types (JPEG, PNG, WebP)
- **File Size Limits:** 10MB maximum
- **Virus Scanning:** Consider adding Supabase Storage virus scanning
- **Storage Isolation:** Files stored by user ID
- **RLS on Storage:** Enforce access control on storage buckets

### 5. Rate Limiting

Consider implementing rate limiting for:
- Login attempts
- API requests
- File uploads
- Voting

**Implementation Options:**
- Vercel Edge Config
- Upstash Redis
- Custom middleware

### 6. Content Security Policy

```typescript
// next.config.js

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Performance Optimization

### 1. Next.js Optimizations

- **Server Components:** Reduce client-side JavaScript
- **Static Generation:** Pre-render pages when possible
- **Incremental Static Regeneration (ISR):** Revalidate static pages
- **Image Optimization:** Automatic with next/image
- **Font Optimization:** Automatic with next/font
- **Code Splitting:** Automatic route-based splitting

### 2. Image Optimization

- **Resize on Upload:** Limit image dimensions
- **Format Conversion:** Convert to efficient formats
- **Responsive Images:** Use next/image with sizes
- **Lazy Loading:** Load images as they enter viewport
- **Blur Placeholder:** Show blur while loading
- **CDN Delivery:** Supabase Storage CDN

```typescript
// Example optimized image usage

import Image from 'next/image';

<Image
  src={completion.image_url}
  alt={`Løpebilde fra ${completion.participant.display_name}`}
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL={completion.thumbnail_url}
/>
```

### 3. Database Optimization

- **Indexes:** Create indexes on frequently queried columns
- **Query Optimization:** Select only needed columns
- **Pagination:** Implement cursor or offset pagination
- **Database Functions:** Use PostgreSQL functions for complex queries
- **Connection Pooling:** Managed by Supabase

### 4. Caching Strategy

```typescript
// Page-level caching
export const revalidate = 60; // Revalidate every 60 seconds

// Fetch-level caching
fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // Revalidate every hour
});

// Dynamic caching based on data
const { data } = await supabase
  .from('participants')
  .select('*')
  .order('created_at', { ascending: false });

// Use Next.js cache tags for on-demand revalidation
```

### 5. Bundle Size Optimization

- **Dynamic Imports:** Lazy load heavy components
- **Tree Shaking:** Remove unused code
- **Analyze Bundle:** Use @next/bundle-analyzer

```typescript
// Dynamic import example
import dynamic from 'next/dynamic';

const ImageUploader = dynamic(
  () => import('@/components/upload/image-uploader'),
  {
    loading: () => <Spinner />,
    ssr: false,
  }
);
```

### 6. Loading States

```typescript
// app/dashboard/loading.tsx

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
```

### 7. Streaming with Suspense

```typescript
// app/dashboard/page.tsx

import { Suspense } from 'react';
import { StatsCards } from './components/stats-cards';
import { ActivityFeed } from './components/activity-feed';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<Skeleton className="h-32" />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
```

---

## Deployment Strategy

### 1. Hosting Platform: Vercel

**Rationale:**
- Seamless Next.js integration
- Automatic deployments
- Preview deployments for PRs
- Edge network
- Generous free tier

### 2. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App
NEXT_PUBLIC_APP_URL=https://bartelopet.no
```

### 3. Deployment Pipeline

```
Git Push → GitHub → Vercel
    │
    ├─ Run Tests
    ├─ Build Project
    ├─ Run Migrations (Supabase)
    ├─ Deploy Preview (PR)
    └─ Deploy Production (main branch)
```

### 4. Database Migrations

```bash
# Run migrations locally
npx supabase migration up

# Push to production
npx supabase db push
```

### 5. Monitoring & Analytics

- **Vercel Analytics:** Page views, performance
- **Sentry:** Error tracking
- **Supabase Logs:** Database queries, auth events

---

## Summary

This architecture document provides a comprehensive blueprint for building the Barteløpet charity run website. The system is designed with the following core principles:

1. **Modern Stack:** Next.js 14 App Router, TypeScript, Supabase
2. **Mobile-First:** Responsive design optimized for mobile devices
3. **Type-Safe:** Full TypeScript coverage with strict mode
4. **Secure:** Authentication, authorization, input validation
5. **Performant:** Server-side rendering, image optimization, caching
6. **Scalable:** Component-based architecture, database optimization
7. **Maintainable:** Clear folder structure, separation of concerns
8. **Norwegian:** UI built in Norwegian (nb-NO) from the start

### Next Steps

1. **Setup Project:** Initialize Next.js project with TypeScript
2. **Configure Supabase:** Create database, run migrations, setup storage
3. **Build Core Components:** UI components library
4. **Implement Authentication:** Magic link authentication flow
5. **Build Pages:** Homepage, registration, dashboard, gallery, participants
6. **Test:** Unit tests, integration tests, E2E tests
7. **Deploy:** Deploy to Vercel with Supabase backend
8. **Monitor:** Setup monitoring and analytics

---

**Document Version:** 1.0
**Last Updated:** 2025-10-28
**Maintained By:** Architect Agent
**Status:** Ready for Implementation
