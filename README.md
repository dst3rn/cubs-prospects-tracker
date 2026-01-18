# Cubs Top 30 Prospects Tracker

A web application to track the Chicago Cubs' top 30 prospects with current stats, rolling performance metrics, and a news feed.

## Features

- **Prospect Rankings**: View all 30 prospects sorted by Pipeline ranking
- **Season Stats**: AVG, OPS, HR, RBI for hitters; ERA, WHIP, K for pitchers
- **Rolling Performance**: Compare 7-day, 14-day, and 30-day stats to season averages
- **Trend Indicators**: Hot/cold streak detection based on recent performance
- **News Feed**: Aggregated RSS feeds from Cubs and affiliate sources
- **Filtering**: Filter by position and minor league level

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Query
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Data Sources**: MLB Stats API, RSS feeds

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
cd cubs-prospects-tracker
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp server/.env.example server/.env
# Edit server/.env with your database URL
```

4. Run database migrations:
```bash
npm run migrate
```

5. Seed initial prospect data:
```bash
cd server && npm run seed
```

### Development

Run both frontend and backend in development mode:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on port 3001.

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/prospects` | All prospects with stats |
| `GET /api/prospects/:id` | Single prospect detail |
| `GET /api/stats/:playerId` | Player stats |
| `GET /api/stats/leaders/batting` | Top hitters |
| `GET /api/stats/leaders/pitching` | Top pitchers |
| `GET /api/news` | Aggregated news feed |
| `POST /api/admin/refresh/stats` | Manual stats refresh |
| `POST /api/admin/refresh/news` | Manual news refresh |

## Scheduled Jobs

- **Stats Refresh**: Daily at 4am Central Time
- **News Refresh**: Every 2 hours

## Updating the Prospect List

When MLB Pipeline rankings change, update the `CUBS_PROSPECTS` array in `server/src/db/seed.js` and re-run the seed script.

## Deployment (Railway)

1. Create a new Railway project
2. Add PostgreSQL addon
3. Set environment variables:
   - `DATABASE_URL` (auto-set by Railway)
   - `NODE_ENV=production`
4. Deploy from GitHub

## License

MIT
