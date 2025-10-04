# Car2Hand Cron Job

A TypeScript-based cron job that monitors Google Sheets for values below a threshold and sends notifications via LINE Official Account.

## Features

- 🔍 **Google Sheets Integration**: Reads data from specified Google Sheets
- 📱 **LINE Notifications**: Sends alerts via LINE Official Account (not LINE Notify)
- 🚨 **Smart Monitoring**: Configurable threshold monitoring with cooldown periods
- � **Multi-Job Support**: Run multiple monitoring jobs with different schedules and configurations
- �🛡️ **Type Safety**: Full TypeScript implementation with strict typing
- 🚂 **Railway Ready**: Optimized for Railway's cron job feature
- 📋 **Comprehensive Logging**: Structured logging for Railway's log system
- ⚙️ **Configurable**: Environment-based configuration with job-specific settings

## Setup Instructions

### 1. Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Download the JSON credentials file
5. Share your Google Sheet with the service account email
6. Copy your Google Sheet ID from the URL

### 2. LINE Official Account Setup

1. Create a LINE Official Account at [LINE Business](https://account.line.biz/)
2. Go to [LINE Developers Console](https://developers.line.biz/)
3. Create a new channel (Messaging API)
4. Get your Channel Access Token
5. Get your User ID (you can get this by messaging your bot)

### 3. MongoDB Setup

For multi-user notifications, the system uses MongoDB to manage job-specific user lists:

1. **Install MongoDB** (if running locally):

   ```bash
   # macOS
   brew install mongodb-community
   # Or use MongoDB Atlas for cloud hosting
   ```

2. **Database Structure**:

   - Database: `car2hand` (configurable)
   - Collection: `jobUserConfigs`
   - Document format:

   ```json
   {
     "_id": "ObjectId",
     "jobName": "notify-overdue-stock-vehicles",
     "userIds": ["LINE_USER_ID_1", "LINE_USER_ID_2"],
     "lastUpdated": "2024-01-01T00:00:00.000Z"
   }
   ```

3. **Managing Users**:
   - Use MongoDB client or GUI tools to add/remove users
   - Each job can have different user lists
   - Users will receive notifications for their assigned jobs only

### 4. Environment Variables

Set these environment variables in Railway:

```bash
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SHEET_NAME_JOB_1=stock
GOOGLE_SHEET_NAME_JOB_2=tax
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}

# LINE Official Account Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_USER_ID=your_line_user_id_to_send_notifications

# MongoDB Configuration
MONGO_CONNECTION_STRING=mongodb://localhost:27017
MONGO_DATABASE=car2hand

# Multiple Jobs Configuration (JSON format)
JOBS_CONFIG=[{"name":"default-monitor","columnIndex":0,"thresholdValue":90,"schedule":"*/30 * * * *","description":"Default monitoring job"},{"name":"secondary-monitor","columnIndex":1,"thresholdValue":85,"schedule":"*/15 * * * *","description":"Secondary column monitoring"},{"name":"additional-monitor","columnIndex":2,"thresholdValue":95,"schedule":"0 */2 * * *","description":"Additional monitoring every 2 hours"}]

# Legacy Configuration (for backward compatibility)
THRESHOLD_VALUE=90
COLUMN_INDEX=0
DEFAULT_SCHEDULE=*/30 * * * *

# Application Configuration
NODE_ENV=production
```

### 5. Railway Deployment

1. Connect your GitHub repository to Railway
2. Set the environment variables in Railway dashboard
3. Railway will automatically build and deploy your cron job
4. Configure cron schedules in Railway dashboard:

**Cron Jobs Setup:**

- **Stock Notifications**: Schedule `0 9 * * *` (daily at 9 AM), Command: `node dist/job1.js`
- **Tax Deadline Notifications**: Schedule `0 10 * * *` (daily at 10 AM), Command: `node dist/job2.js`

**Job Names for MongoDB:**

- Stock notifications: `notify-overdue-stock-vehicles`
- Tax deadline notifications: `notify-vehicles-near-tax-deadline`

## Project Structure

```
src/
├── index.ts              # Main entry point and cron job logic
├── config.ts             # Configuration management
├── types.ts              # TypeScript type definitions
├── logger.ts             # Logging service
├── googleSheetsService.ts # Google Sheets API integration
└── lineService.ts        # LINE messaging service
```

## Configuration Options

### Single Job Configuration (Legacy)

| Variable           | Default        | Description                             |
| ------------------ | -------------- | --------------------------------------- |
| `THRESHOLD_VALUE`  | 90             | Values below this trigger notifications |
| `COLUMN_INDEX`     | 0              | Which column to monitor (0-based)       |
| `DEFAULT_SCHEDULE` | `*/30 * * * *` | Default cron schedule                   |

### Multi-Job Configuration (Recommended)

Use `JOBS_CONFIG` environment variable with JSON array:

```json
[
  {
    "name": "inventory-monitor",
    "columnIndex": 0,
    "thresholdValue": 90,
    "schedule": "*/30 * * * *",
    "description": "Monitor inventory levels every 30 minutes"
  },
  {
    "name": "quality-check",
    "columnIndex": 1,
    "thresholdValue": 85,
    "schedule": "*/15 * * * *",
    "description": "Quality score monitoring every 15 minutes"
  },
  {
    "name": "daily-summary",
    "columnIndex": 2,
    "thresholdValue": 95,
    "schedule": "0 */2 * * *",
    "description": "Summary check every 2 hours"
  }
]
```

## How It Works

1. **Authentication**: Authenticates with Google Sheets API using service account
2. **Data Reading**: Reads the specified column from your Google Sheet
3. **Threshold Check**: Compares each numeric value against the threshold
4. **Notification**: Sends LINE messages for values below threshold
5. **Cooldown**: Prevents spam by implementing 1-hour cooldown per row
6. **Logging**: Comprehensive logging to Railway's log system

## Development

```bash
# Install dependencies
npm install

# Run in development mode (all jobs)
npm run dev

# Test services configuration
npm test

# Build for production
npm run build

# Start production build (all jobs)
npm start

# Run specific jobs in production
npm run job1    # Run default-monitor job
npm run job2    # Run secondary-monitor job
npm run job3    # Run additional-monitor job

# Run specific job by name
npm run run-job default-monitor
npm run run-job secondary-monitor
```

## Railway Cron Setup

### Option 1: Multiple Independent Cron Jobs (Recommended)

Create separate cron jobs in Railway dashboard for different schedules:

1. **Inventory Monitor Job**

   - Schedule: `*/30 * * * *` (every 30 minutes)
   - Command: `npm run job1`
   - Job Name: `default-monitor`

2. **Quality Check Job**

   - Schedule: `*/15 * * * *` (every 15 minutes)
   - Command: `npm run job2`
   - Job Name: `secondary-monitor`

3. **Daily Summary Job**
   - Schedule: `0 */2 * * *` (every 2 hours)
   - Command: `npm run job3`
   - Job Name: `additional-monitor`

### Option 2: Single Job with All Monitors

Run all monitoring jobs together:

- Schedule: `*/15 * * * *` (or your preferred frequency)
- Command: `npm start`

### Option 3: Manual Job Execution

Run specific jobs on demand:

- Command: `npm run run-job job-name`
- Replace `job-name` with: `default-monitor`, `secondary-monitor`, etc.

### Cron Schedule Examples

- `*/15 * * * *` - Every 15 minutes
- `*/30 * * * *` - Every 30 minutes
- `0 * * * *` - Every hour at minute 0
- `0 */2 * * *` - Every 2 hours
- `0 9,17 * * *` - At 9 AM and 5 PM daily
- `0 0 * * 1-5` - Every weekday at midnight

## Features

- **Type Safety**: Full TypeScript with strict mode enabled
- **Error Handling**: Comprehensive error handling and logging
- **Notification Cooldown**: Prevents spam notifications
- **Connection Validation**: Validates services before running
- **Configurable Thresholds**: Easy to adjust monitoring parameters
- **Railway Optimized**: Built specifically for Railway's platform

## Troubleshooting

Check Railway logs for detailed error messages. Common issues:

1. **Google Sheets Access**: Ensure service account has access to the sheet
2. **LINE Token**: Verify LINE channel access token is correct
3. **Environment Variables**: Check all required variables are set
4. **Sheet Format**: Ensure the monitored column contains numeric values

## License

MIT License
