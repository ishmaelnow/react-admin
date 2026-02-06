# FairFare Admin Dashboard

Separate admin application for managing FairFare transportation platform.

## Features

- 🔐 Admin-only authentication
- 🚗 Driver management (approve/reject/manage)
- 👥 User management (coming soon)
- 📋 Ride management (coming soon)
- 📊 Analytics (coming soon)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env` and update with your Supabase credentials
   - Ensure `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are set

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Admin Access

To grant admin access:
1. Go to Supabase Dashboard → Table Editor → `profiles`
2. Find the user's profile
3. Update the `role` field to `'admin'`
4. User can now log in to the admin dashboard

## Deployment

### Netlify Setup

1. Create a new Netlify site
2. Connect to your repository
3. Set build settings:
   - **Base directory:** `react-admin`
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
4. Add custom domain: `admin.fairfareride.com`
5. Configure DNS:
   - Add CNAME record: `admin.fairfareride.com → your-netlify-site.netlify.app`

### Environment Variables (Netlify)

Set these in Netlify dashboard:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_ADMIN_MODE=true`

## Security

- All routes are protected by admin role check
- Non-admin users are redirected to login
- Admin routes require authentication
- Uses same Supabase backend as public app

## Project Structure

```
react-admin/
├── src/
│   ├── components/     # Reusable components
│   │   ├── AdminNav.js
│   │   └── AdminRoute.js
│   ├── contexts/       # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/           # Utilities
│   │   ├── auth.js
│   │   └── supabase.js
│   ├── pages/         # Page components
│   │   ├── Dashboard.js
│   │   ├── DriverManagement.js
│   │   └── Login.js
│   ├── App.js         # Main app component
│   └── index.js       # Entry point
├── public/
│   └── index.html
├── package.json
└── .env
```

## Notes

- This is a separate app from the public-facing React frontend
- Shares the same Supabase backend
- Admin-only functionality is isolated for security
- Can be deployed to a separate subdomain

