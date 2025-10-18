# Vercel Deployment Guide

## Frontend Deployment (Next.js)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy from project root

```bash
vercel --prod
```

### 4. Configure Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard and add these environment variables:

- `BACKEND_URL`: Your production backend API URL
- `NEXTAUTH_URL`: Your Vercel domain (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET`: A secure random string (generate with `openssl rand -base64 32`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

### 5. Set Build Settings

In Vercel dashboard:

- **Build Command**: `cd apps/frontend && yarn build`
- **Output Directory**: `apps/frontend/.next`
- **Install Command**: `yarn install`

## Backend Deployment Options

Since Vercel doesn't natively support NestJS applications, deploy your backend to one of these platforms:

### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Render

1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Set build command: `yarn build`
4. Set start command: `yarn start:prod`

### Option 3: Vercel Serverless (Advanced)

Convert your NestJS app to Vercel serverless functions using `@vercel/node`.

## Post-Deployment Checklist

- [ ] Update `BACKEND_URL` in Vercel environment variables
- [ ] Update `NEXTAUTH_URL` with your Vercel domain
- [ ] Test authentication flow
- [ ] Test Stripe payment integration
- [ ] Verify file uploads work
- [ ] Test all API endpoints
- [ ] Check internationalization (i18n) works
- [ ] Verify email sending functionality

## Domain Configuration

1. Add your custom domain in Vercel dashboard
2. Update DNS records as instructed
3. Update `NEXTAUTH_URL` environment variable with custom domain
4. Configure CORS in your backend for the custom domain
