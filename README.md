# INE Product Price Tracker

## Overview
A full-stack web application that tracks product prices from the INE mock store. It enables users to search for products, add them to a tracking list, and automatically monitors their prices and stock availability over time.

## Features
- Product search (full/partial name)
- Product price/stock tracking
- Automated scraping every 2 hours
- Price history charts
- Scrape logs with attempt details
- Manual scrape trigger
- Headed browser mode for demos
- Retry mechanism with exponential backoff
- Data validation and integrity
- Responsive dashboard

## Architecture
See [docs/architecture.md](docs/architecture.md) for full details.
Basic flow: `User -> React Frontend -> Express API -> Supabase DB`. External cron triggers the Express API to scrape the mock store using Playwright.

## Tech Stack
| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS (Vercel) |
| Backend | Node.js, Express.js (Render) |
| Database | Supabase (PostgreSQL) |
| Scraping | Playwright |
| Scheduling | cron-job.org |

## Folder Structure
```
ine-price-tracker/
├── frontend/             # React application
│   ├── src/
│   └── package.json
├── backend/              # Express API & Scraper
│   ├── src/
│   ├── tests/
│   └── package.json
├── docs/                 # Documentation
│   ├── architecture.md
│   ├── api.md
│   ├── design-note.md
│   └── scraper-reliability.md
├── database/             # SQL schemas
│   └── schema.sql
└── README.md
```

## Local Setup

1. Clone repo: `git clone <repo-url> cd ine-price-tracker`
2. Set up Supabase: Create a project and run `database/schema.sql`.
3. Configure environment: Create `.env` files in both frontend and backend directories.
4. Install dependencies: Run `npm install` in both directories.
5. Run the app: Follow the frontend and backend instructions below.

## Environment Variables

**Backend (`backend/.env`)**
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
CRON_SECRET=your_secure_cron_secret
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=http://localhost:3000/api
```

## Database Setup
1. Create a Supabase project at supabase.com.
2. Open the SQL Editor in your Supabase dashboard.
3. Run the contents of `database/schema.sql`.
4. Copy the Project URL and `service_role` secret key into your backend `.env` file.

## Running Frontend
```bash
cd frontend
npm install
npm run dev
```

## Running Backend
```bash
cd backend
npm install
npm run dev
```

## Running Scraper
```bash
cd backend
npm run scraper:test
# To test a specific product:
npm run scraper:test "laptop"
```

## Headed Scraper Demo
Watch the browser physically open and scrape.
```bash
cd backend
npm run scraper:headed
# For a specific product:
npm run scraper:headed "phone"
```

## Scraping Strategy
The application uses Playwright because the target is a React SPA where HTTP requests yield no HTML content. Playwright runs a headless Chromium browser to render JavaScript and extract the necessary DOM elements.

## Retry Strategy
The scraper implements exponential backoff (0s, 2s, 5s) for up to 3 attempts to handle temporary network or rendering issues.

## Failure Handling
Failed scrapes do not halt the system. They are logged comprehensively in the database to preserve historical context without corrupting actual price trends.

## Scheduling
Scheduling is managed via cron-job.org. It pings a secure endpoint (`/api/scrape/all`) every 2 hours. This external approach ensures reliability even if the backend service is paused by free-tier hosting limitations.

## API Documentation
See [docs/api.md](docs/api.md) for full endpoint specifications.

## Deployment

### Vercel (Frontend)
1. Connect GitHub repo to Vercel.
2. Set root directory to `frontend`.
3. Add `VITE_API_URL` to Vercel Environment Variables.
4. Deploy.

### Render (Backend)
1. Create a new Web Service on Render.
2. Connect repo, set Root Directory to `backend`.
3. Build command: `npm install && npx playwright install chromium`
4. Start command: `npm start`
5. Add environment variables (`SUPABASE_URL`, etc.).

### Supabase (Database)
Database is managed via Supabase cloud. No deployment needed after initial schema setup.

### cron-job.org (Scheduler)
1. Create an account.
2. Create a new cron job pointing to `https://your-render-url/api/scrape/all`.
3. Set schedule to every 2 hours.
4. Add Header: `Authorization: Bearer <YOUR_CRON_SECRET>`.

## Testing
```bash
cd backend
npm test
npm run scraper:test
```

## Design Decisions
See [docs/design-note.md](docs/design-note.md) for detailed reasoning behind architecture choices.

## Known Limitations
- Scraper depends on mock store HTML structure. If DOM changes, selectors fail.
- Free tier Render may sleep, meaning the first request or cron ping might have a cold start delay.
- Playwright requires Chromium, making the backend bundle larger.
- No user authentication implemented.

## Future Improvements
- Email/push notifications for price drops
- Multiple store support
- User accounts
- Price drop alerts
- Export data as CSV
