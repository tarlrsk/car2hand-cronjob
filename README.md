# Car2Hand Cron Job

A TypeScript cron job that monitors Google Sheets for vehicle data and sends notifications via LINE Bot.

## Features

- **Stock Monitoring**: Notifies when vehicles are in stock for 2+ months
- **Tax Deadline Alerts**: Notifies when vehicle tax expires within 60 days
- **Multi-User Support**: MongoDB-based user management per job type
- **LINE Integration**: Sends notifications via LINE Official Account

## Quick Setup

1. **Environment Variables**

   ```bash
   cp .env.example .env
   # Fill in your credentials
   ```

2. **Install & Run**
   ```bash
   npm install
   npm start
   ```

## Configuration

```env
# Google Sheets
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}

# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_USER_ID=your_user_id

# MongoDB
MONGO_CONNECTION_STRING=mongodb://localhost:27017
MONGO_DATABASE=car2hand
```

## How It Works

1. **Stock Notifications**: Checks vehicles in stock ≥ 2 months, sends monthly reminders
2. **Tax Notifications**: Finds vehicles with tax expiring ≤ 60 days, limited to 30 cars per message
3. **Multi-User**: Each job type can have different LINE user lists stored in MongoDB
4. **Group Support**: Can send notifications to both individual users and LINE groups

## User & Group Management

**Database Configuration:**

```json
{
  "jobName": "notify-overdue-stock-vehicles",
  "receiverLineIds": ["USER_ID_1", "USER_ID_2"],
  "groupLineGroupIds": ["GROUP_ID_1", "GROUP_ID_2"],
  "sheetName": "stock",
  "isActive": true
}
```

**Features:**

- **Individual Users**: Add LINE user IDs to `receiverLineIds`
- **Groups**: Add LINE group IDs to `groupLineGroupIds`
- **Per Job**: Each notification job can have different recipients
- **Message Splitting**: Tax notifications split into 30-car chunks if needed

## Deployment

**Railway**: Set environment variables and deploy. The app runs once and exits cleanly.

## Project Structure

```
src/
├── job/                    # Notification jobs
├── service/               # Google Sheets, LINE, MongoDB services
├── config/                # Configuration management
└── index.ts               # Main entry point
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (all jobs)
npm run dev

# Build for production
npm run build

# Start production build (all jobs)
npm start
```
