# 🏃 Barteløpet - Virtual Charity Run Platform

A modern web platform for organizing virtual charity runs supporting mental health awareness through Movember. Built with Next.js 14, TypeScript, and Supabase.

## 🎯 Overview

Barteløpet is a Norwegian charity run event where participants complete a route in Stavanger city center during November, upload proof of completion, and vote on other participants' submissions. All participants receive a trophy, with additional prizes for the best photos.

## 🏗️ Architecture

The project follows a **Vertical Slices Architecture** pattern where features are organized as self-contained modules.

```
barteløpet/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── (auth)/           # Auth route group
│   └── [pages]/          # Application pages
├── features/              # Vertical slice modules
│   ├── shared/           # Shared infrastructure
│   ├── public-pages/     # Static pages
│   ├── participants/     # Participant management
│   └── [other-features]/ # Feature modules
├── components/           # UI components
├── lib/                 # Core libraries
│   ├── supabase/       # Database client
│   ├── utils/          # Utilities
│   └── vipps/          # Vipps integration
├── types/               # TypeScript definitions
├── supabase/           # Database migrations
└── public/             # Static assets
```

## 🚀 Tech Stack

### Core Technologies
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** Custom components + [Radix UI](https://www.radix-ui.com/)

### Backend & Database
- **BaaS:** [Supabase](https://supabase.com/)
  - PostgreSQL database
  - Authentication (Magic links)
  - File storage
  - Row Level Security (RLS)
- **Rate Limiting:** [Upstash Redis](https://upstash.com/)

### Third-Party Integrations
- **Vipps:** Norwegian payment/ID OAuth provider
- **Mapbox/MapLibre:** Route visualization
- **Upstash:** Rate limiting for API endpoints

## 📋 Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Upstash Redis account (for rate limiting)
- Vipps developer account (optional, for Vipps login)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/barteløpet.git
cd barteløpet
```

### 2. Install dependencies
```bash
pnpm install
# or
npm install
```

### 3. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env.local
```

Configure the following environment variables in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Vipps OAuth (optional)
VIPPS_CLIENT_ID=your_vipps_client_id
VIPPS_CLIENT_SECRET=your_vipps_client_secret
VIPPS_REDIRECT_URI=http://localhost:3000/auth/vipps-callback
VIPPS_MERCHANT_SERIAL_NUMBER=your_merchant_serial_number
VIPPS_SUBSCRIPTION_KEY=your_subscription_key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Database Setup

Run the Supabase migrations:

```bash
# The migrations are in supabase/migrations/
# Apply them in your Supabase dashboard or using Supabase CLI
```

See [`docs/setup/SUPABASE_SETUP.md`](docs/setup/SUPABASE_SETUP.md) for detailed database setup instructions.

## 🚀 Development

### Start the development server
```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production
```bash
pnpm build
# or
npm run build
```

### Run production build locally
```bash
pnpm start
# or
npm start
```

## 📁 Project Structure

### Key Directories

- **`/app`** - Next.js App Router pages and API routes
- **`/features`** - Vertical slice feature modules
- **`/components`** - Reusable UI components
- **`/lib`** - Core utilities and configurations
- **`/supabase/migrations`** - Database schema and migrations
- **`/public`** - Static assets (images, fonts, etc.)
- **`/types`** - TypeScript type definitions

### Feature Module Structure

Each feature in `/features` follows this structure:

```
features/[feature-name]/
├── components/     # Feature-specific UI
├── server/        # Server-side logic
├── hooks/         # React hooks
├── lib/           # Feature utilities
├── types/         # TypeScript types
└── index.ts       # Public API
```

## 🔑 Key Features

- **User Registration** - Magic link authentication
- **Multi-Image Upload** - Participants can upload multiple completion photos
- **Voting System** - Vote for best submissions
- **Gallery** - Browse all submissions
- **Dashboard** - Personal statistics and management
- **Multi-Year Support** - Handles events across different years
- **Norwegian Localization** - Full Norwegian UI

## 🗄️ Database Schema

Key tables:
- `participants` - User registrations per year
- `completions` - Run submissions
- `completion_images` - Multiple images per completion
- `votes` - Voting records
- `photo_comments` - Comments on submissions

## 🔒 Security

- Row Level Security (RLS) on all tables
- Rate limiting on API endpoints
- Input validation with Zod
- CSRF protection (Next.js built-in)
- Secure file upload validation

## 📚 Documentation

- [`/docs/setup/`](docs/setup/) - Setup and configuration guides
- [`/docs/architecture/`](docs/architecture/) - Architecture documentation
- [`/docs/features/`](docs/features/) - Feature-specific documentation
- [`/docs/deployment/`](docs/deployment/) - Deployment guides

## 🚢 Deployment

The application is optimized for deployment on [Vercel](https://vercel.com/):

1. Push your code to GitHub
2. Import the project to Vercel
3. Configure environment variables
4. Deploy

See [`docs/deployment/DEPLOYMENT_CHECKLIST.md`](docs/deployment/DEPLOYMENT_CHECKLIST.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for Barteløpet/ÅpenAid.

## 🆘 Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ for supporting mental health awareness through Movember