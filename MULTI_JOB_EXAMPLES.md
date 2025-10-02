# Multi-Job Configuration Examples

## Example 1: Basic Multi-Job Setup

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
  }
]
```

## Example 2: Advanced Multi-Job Setup

```json
[
  {
    "name": "critical-stock",
    "columnIndex": 0,
    "thresholdValue": 95,
    "schedule": "*/10 * * * *",
    "description": "Critical stock monitoring every 10 minutes"
  },
  {
    "name": "performance-metrics",
    "columnIndex": 2,
    "thresholdValue": 80,
    "schedule": "*/20 * * * *",
    "description": "Performance metrics check every 20 minutes"
  },
  {
    "name": "daily-summary",
    "columnIndex": 3,
    "thresholdValue": 75,
    "schedule": "0 8,16 * * *",
    "description": "Daily summary at 8 AM and 4 PM"
  },
  {
    "name": "weekend-check",
    "columnIndex": 1,
    "thresholdValue": 88,
    "schedule": "0 */3 * * 6,0",
    "description": "Weekend monitoring every 3 hours"
  }
]
```

## Railway Cron Job Configuration

### Method 1: Separate Cron Jobs (Recommended)

1. Create multiple cron jobs in Railway:
   - Job 1: `npm run job1` with schedule `*/30 * * * *`
   - Job 2: `npm run job2` with schedule `*/15 * * * *`
   - Job 3: `npm run job3` with schedule `0 */2 * * *`

### Method 2: Single Master Job

1. Create one cron job in Railway:
   - Command: `npm start`
   - Schedule: Most frequent schedule needed
   - All jobs will run together

### Method 3: Dynamic Job Execution

1. Create cron jobs for specific jobs:
   - Command: `npm run run-job inventory-monitor`
   - Command: `npm run run-job quality-check`
   - Each with their own schedule

## Environment Variable Setup

```bash
# Set this in Railway environment variables
JOBS_CONFIG=[{"name":"inventory-monitor","columnIndex":0,"thresholdValue":90,"schedule":"*/30 * * * *","description":"Monitor inventory levels"},{"name":"quality-check","columnIndex":1,"thresholdValue":85,"schedule":"*/15 * * * *","description":"Quality monitoring"}]
```

## Column Index Reference

- Column A = 0
- Column B = 1
- Column C = 2
- Column D = 3
- etc.

## Schedule Format (Cron)

```
* * * * *
│ │ │ │ └── Day of week (0-7)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

Examples:

- `*/15 * * * *` = Every 15 minutes
- `0 */2 * * *` = Every 2 hours
- `0 9,17 * * 1-5` = 9 AM and 5 PM on weekdays
