# Migration Guide: From Cron Job to Vercel API

This guide helps you migrate your existing cron job deployment to the new API-based Vercel deployment.

## Key Changes

### 1. Architecture Change

- **Before**: Standalone cron job running on Railway/VPS
- **After**: API endpoints deployed on Vercel, triggered by external cron services

### 2. New Files Added

- `api/` directory with endpoint handlers
- `vercel.json` configuration
- `.github/workflows/` for deployment automation
- `API.md` documentation

### 3. Updated Files

- `package.json` - Added Vercel dependencies and scripts
- `tsconfig.json` - Updated to include API directory
- `.env.example` - Added Vercel-specific variables

## Migration Steps

### Step 1: Update Environment Variables

If migrating from Railway or another platform, update your environment variables:

```bash
# Add these new variables
API_SECRET=your-secret-api-key-here
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

### Step 2: Deploy to Vercel

1. **Via GitHub (Recommended)**:

   - Push your code to GitHub
   - Connect repository to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy automatically via GitHub Actions

2. **Via CLI**:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

### Step 3: Set Up Cron Triggers

Choose one of these options:

#### Option A: GitHub Actions (Recommended)

- Use the provided `.github/workflows/cron.yml`
- Set required secrets in GitHub repository settings
- Runs on GitHub's infrastructure for free

#### Option B: External Cron Service

- Use services like cron-job.org or EasyCron
- Configure to call your API endpoints
- More reliable for critical operations

### Step 4: Update Monitoring

If you were monitoring the standalone cron job:

1. **Update health checks**: Point to `/api/health`
2. **Update alerting**: Monitor API response codes instead of process status
3. **Update logs**: Use Vercel's function logs or implement centralized logging

### Step 5: Test Migration

1. Test health endpoint: `GET /api/health`
2. Test job endpoints with authentication
3. Verify cron triggers are working
4. Check LINE notifications are sent correctly

## Rollback Plan

If you need to rollback:

1. Keep your old deployment running until migration is verified
2. Update DNS/cron services to point back to old system
3. The `src/index.ts` file still supports standalone execution

## Benefits of New Architecture

- **Cost-effective**: Vercel's generous free tier
- **Scalable**: Automatic scaling based on demand
- **Reliable**: Built-in redundancy and global edge network
- **Maintainable**: Easier to deploy and update via GitHub
- **Flexible**: Can trigger jobs on-demand or via different schedules

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check API_SECRET configuration
2. **Timeout**: Increase function timeout in vercel.json
3. **Build Errors**: Ensure all dependencies are in package.json
4. **Environment Variables**: Double-check all required variables are set

### Getting Help:

- Check Vercel function logs
- Use `/api/health` to verify deployment
- Review API.md for detailed endpoint documentation
