# AEGIS Professional Care Portal - Vercel Deployment

## Quick Start

1. **Download this deployment-package folder**
2. **Upload to Vercel:**
   - Go to vercel.com
   - Connect your GitHub account
   - Create new repository with these files
   - Import project from GitHub to Vercel

## Environment Variables Required

Set these in Vercel dashboard under Settings > Environment Variables:

```
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

## Build Settings in Vercel

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## Database Setup

Your Neon database URL from the current project should work directly.
If you need a new database, the schema is in `shared/schema.ts`.

## Login Credentials

- **Admin:** aegis / admin123
- **Employee:** employee@healthcare.com / emp123
- **Family:** family@healthcare.com / family123

## Features Included

✅ Three-portal system (Admin, Employee, Family)
✅ Complete patient management
✅ CRM lead pipeline (8 stages)
✅ Real-time messaging
✅ File uploads
✅ Authentication system
✅ Database operations with data integrity
✅ Responsive design with AEGIS branding