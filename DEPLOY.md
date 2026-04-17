# Deploying NeonSynth to Vercel
 
NeonSynth is configured and ready for deployment on Vercel.

## 🚀 Quick Deploy

### Option 1: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy from the project directory
cd neon-synth
vercel

# For production deployment
vercel --prod
```

### Option 2: GitHub Integration

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the Vite configuration
6. Click "Deploy"

### Option 3: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure build settings (auto-detected):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## 📋 Configuration

The `vercel.json` file includes:

- **SPA Rewrites**: All routes redirect to `index.html` for client-side routing
- **Asset Caching**: Static assets cached for 1 year with immutable flag
- **Build Settings**: Explicit build and output configuration

## 🔧 Build Verification

Before deploying, verify the build locally:

```bash
npm run build
npm run preview
```

The `dist/` folder contains:
- `index.html` - Entry point with proper meta tags
- `assets/` - Hashed JS and CSS bundles
- `favicon.svg` - App icon
- `icons.svg` - UI icons

## 🌐 Environment Variables

No environment variables are required for NeonSynth. The app runs entirely in the browser using the Web Audio API.

## ⚡ Performance Features

- **Code Splitting**: Automatic via Vite
- **Tree Shaking**: Unused code eliminated
- **Minification**: Production builds are minified
- **Gzip Compression**: ~65% size reduction
- **Static Asset Caching**: Long-term caching for assets

## 🎯 Post-Deployment Checklist

After deployment:

1. ✅ Verify the app loads without errors
2. ✅ Test audio playback in different browsers
3. ✅ Check that export functionality works
4. ✅ Verify responsive design on mobile
5. ✅ Test with different bilateral patterns
6. ✅ Confirm WAV export downloads correctly

## 🔗 Custom Domain

To add a custom domain:

1. Go to your project in Vercel dashboard
2. Navigate to "Domains"
3. Add your domain
4. Update DNS records as instructed

## 📊 Analytics

Enable Vercel Analytics by adding to your project settings:
- Go to "Analytics" in dashboard
- Click "Enable"
- No code changes needed

---

**Built with**: Svelte 5 + Vite + TypeScript + Web Audio API  
**Target Platform**: Modern browsers with Web Audio API support
