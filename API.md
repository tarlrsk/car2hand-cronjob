# Car2Hand Cron Job API

This project has been converted from a standalone cron job to support API endpoints for deployment on Vercel with GitHub integration.

## API Endpoints

### Health Check

- **GET** `/api/health`
- Returns API status and available endpoints
- No authentication required

### Notify Overdue Stock Vehicles

- **POST** `/api/notify-overdue-stock`
- Triggers the overdue stock vehicles notification job
- Requires Bearer token authentication

### Notify Vehicles Near Tax Deadline

- **POST** `/api/notify-tax-deadline`
- Triggers the tax deadline notification job
- Requires Bearer token authentication

## Authentication

All job endpoints require Bearer token authentication:

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/notify-overdue-stock \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json"
```

## Environment Variables

Set these environment variables in your Vercel project:

```env
# Google Sheets API Configuration
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_CREDENTIALS_JSON=your_credentials_json

# LINE Official Account Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_USER_ID=your_line_user_id

# MongoDB Configuration
MONGO_CONNECTION_STRING=your_mongo_connection
MONGO_DATABASE=your_database_name

# Timezone Configuration
TZ=Asia/Bangkok

# API Security
API_SECRET=your-secret-api-key-here

# Node Environment
NODE_ENV=production
```

## Deployment

### Automatic Deployment with GitHub Actions

1. Fork or clone this repository
2. Connect your GitHub repository to Vercel
3. Set up the following GitHub secrets:

   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

4. Push to the `main` branch to trigger automatic deployment

### Manual Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel --prod`

## Setting Up Cron Jobs

You can set up external cron services to call your API endpoints:

### Using GitHub Actions (Scheduled Workflows)

Create `.github/workflows/cron.yml`:

```yaml
name: Scheduled Cron Jobs

on:
  schedule:
    # Run overdue stock check daily at 9 AM Thailand time (2 AM UTC)
    - cron: "0 2 * * *"
    # Run tax deadline check daily at 10 AM Thailand time (3 AM UTC)
    - cron: "0 3 * * *"

jobs:
  notify-overdue-stock:
    runs-on: ubuntu-latest
    steps:
      - name: Call overdue stock API
        run: |
          curl -X POST https://your-vercel-domain.vercel.app/api/notify-overdue-stock \
            -H "Authorization: Bearer ${{ secrets.API_SECRET }}" \
            -H "Content-Type: application/json"

  notify-tax-deadline:
    runs-on: ubuntu-latest
    steps:
      - name: Call tax deadline API
        run: |
          curl -X POST https://your-vercel-domain.vercel.app/api/notify-tax-deadline \
            -H "Authorization: Bearer ${{ secrets.API_SECRET }}" \
            -H "Content-Type: application/json"
```

### Using External Cron Services

You can also use external services like:

- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronhooks](https://cronhooks.io)

Configure them to make POST requests to your API endpoints with the proper authentication headers.

## Local Development

1. Install dependencies: `npm install`
2. Copy environment variables: `cp .env.example .env`
3. Fill in your environment variables in `.env`
4. Start development server: `npm run api:dev`
5. Test endpoints at `http://localhost:3000/api/health`

## Function Timeouts

The Vercel configuration sets a 5-minute (300 seconds) timeout for the job functions to ensure they have enough time to complete their operations.

## Error Handling

All API endpoints return JSON responses with appropriate HTTP status codes:

- `200`: Success
- `401`: Unauthorized (missing or invalid API secret)
- `405`: Method not allowed
- `500`: Internal server error

Example error response:

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error message",
  "timestamp": "2025-10-13T10:30:00.000Z"
}
```
