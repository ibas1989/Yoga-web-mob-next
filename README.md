# Yoga Class Tracker - Web + Mobile

A unified yoga class tracking application with both web and mobile native applications.

## 📁 Project Structure

This is a **monorepo** containing three main workspaces:

```
yoga-tracker-unified/
├── web/           # Next.js web application
├── mobile/        # React Native + Expo mobile application
└── shared/        # Shared code (types, utilities, business logic)
```

### Workspaces

- **`web/`** - Next.js 15 web application with TypeScript
- **`mobile/`** - React Native + Expo mobile application (iOS & Android)
- **`shared/`** - Shared TypeScript code used by both web and mobile

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- For mobile development:
  - iOS: macOS with Xcode
  - Android: Android Studio

### Installation

1. **Install dependencies** (from root):
```bash
npm install
```

This will install dependencies for all workspaces (web, mobile, shared).

2. **Install workspace dependencies**:
```bash
# Install web dependencies
cd web && npm install && cd ..

# Install mobile dependencies
cd mobile && npm install && cd ..

# Install shared dependencies
cd shared && npm install && cd ..
```

## 🎯 Development

### Web Application

```bash
# From root
npm run dev:web

# Or from web directory
cd web
npm run dev
```

Web app will be available at: http://localhost:3000

### Mobile Application

```bash
# From mobile directory
cd mobile

# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web (for testing)
npm run web
```

## 📦 Shared Code

The `shared/` directory contains code used by both web and mobile:

- **Types**: `lib/types.ts` - TypeScript type definitions
- **Utilities**: `lib/utils/` - Date utilities, test utilities
- **i18n**: `lib/i18n/` - Internationalization (English, Russian)
- **Event System**: `lib/eventSystem.ts` - Event handling system

### Using Shared Code

Both web and mobile can import from shared:

```typescript
// In web or mobile
import { Student, Session } from '@shared/types';
import { formatDate } from '@shared/utils/dateUtils';
import { useTranslation } from '@shared/i18n';
```

## 🏗️ Architecture

### Web (`web/`)
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- React 19
- Radix UI components

### Mobile (`mobile/`)
- React Native + Expo
- TypeScript
- Expo Router (for navigation)
- React Navigation (for advanced navigation)
- AsyncStorage (for local data storage)

### Shared (`shared/`)
- TypeScript types and interfaces
- Business logic utilities
- i18n translations
- Event system

## 📝 Code Organization

### Web Structure
```
web/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Web-specific utilities
│   ├── storage.ts    # localStorage implementation
│   ├── hooks/        # React hooks
│   └── utils.ts      # Web-specific utilities
└── public/           # Static assets
```

### Mobile Structure
```
mobile/
├── App.tsx           # Main app component
├── src/
│   ├── screens/      # Screen components
│   ├── components/    # Reusable components
│   ├── lib/          # Mobile-specific utilities
│   │   └── storage.ts # AsyncStorage implementation
│   └── navigation/   # Navigation setup
└── assets/           # Images, fonts, etc.
```

### Shared Structure
```
shared/
└── lib/
    ├── types.ts      # TypeScript types
    ├── utils/        # Utility functions
    ├── i18n/         # Translations
    └── eventSystem.ts # Event handling
```

## 🔄 Migration from Original Repository

This repository was created from the original `Yoga` repository and restructured for dual codebase (web + mobile) development.

- **Original repository**: `/Users/ivanbasyj/Yoga` (untouched)
- **New repository**: This repository (`Yoga-web-mob`)

See `MIGRATION_NOTE.md` for details.

## 📚 Documentation

- `MIGRATION_NOTE.md` - Migration details from original repository
- `web/README.md` - Web application documentation
- `mobile/README.md` - Mobile application documentation
- `shared/README.md` - Shared code documentation

## 🛠️ Build & Deploy

### Web Build
```bash
cd web
npm run build
npm start
```

### Mobile Build
```bash
cd mobile
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📄 License

Private project for personal use.

## 🤝 Contributing

This is a private project. No external contributions at this time.
