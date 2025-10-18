#!/bin/bash

# Vercel Deployment Script for Talent CRM

echo "🚀 Starting deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel if not already logged in
echo "🔐 Checking Vercel authentication..."
vercel login

# Deploy to production
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Add environment variables (BACKEND_URL, NEXTAUTH_SECRET, etc.)"
echo "3. Deploy your backend to Railway/Render/Vercel"
echo "4. Update BACKEND_URL with your backend's production URL"
echo "5. Test your application thoroughly"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"