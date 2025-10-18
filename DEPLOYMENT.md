# Vercel Deployment Guide

## Monorepo Deployment (Frontend + Backend)

Both your Next.js frontend and NestJS backend will be deployed to Vercel using the monorepo configuration.

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

- `BACKEND_URL`: Your Vercel domain (e.g., `https://your-app.vercel.app`) - same as frontend
- `NEXTAUTH_URL`: Your Vercel domain (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET`: A secure random string (generate with `openssl rand -base64 32`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `FRONTEND_URL`: Your Vercel domain (for CORS in backend)
- `DATABASE_URL`: Your production database URL
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `OPENAI_API_KEY`: Your OpenAI API key (if using AI features)
- `AWS_ACCESS_KEY_ID`: Your AWS access key (for S3)
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key (for S3)
- `S3_BUCKET_NAME`: Your S3 bucket name

### 5. Build Settings

Vercel will automatically use the `vercel.json` configuration for monorepo builds:

- Frontend: Next.js build in `apps/frontend/`
- Backend: NestJS serverless build in `apps/backend/`

## Post-Deployment Checklist

- [ ] Update all environment variables in Vercel dashboard
- [ ] Test authentication flow
- [ ] Test Stripe payment integration
- [ ] Verify file uploads work
- [ ] Test all API endpoints
- [ ] Check internationalization (i18n) works
- [ ] Verify email sending functionality
- [ ] Test database connections

## Domain Configuration

1. Add your custom domain in Vercel dashboard
2. Update DNS records as instructed
3. Update `NEXTAUTH_URL`, `BACKEND_URL`, and `FRONTEND_URL` environment variables with custom domain
4. CORS is already configured for the same domain
