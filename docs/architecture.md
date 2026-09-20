# Architecture

## System Overview

```text
User → React Frontend (Vercel) → Express REST API (Render) → Supabase PostgreSQL
                                      ↑
cron-job.org → POST /api/scrape/all → Express Backend → Scraper Service → Mock Store → Validate → Supabase
```

The system is composed of the following layers:

1. **Frontend Layer (React + Vite on Vercel)**
   - Provides the user interface for tracking products and viewing price history.
   - Built as a single-page application (SPA).
   
2. **API Layer (Express.js on Render)**
   - Acts as the central hub, handling requests from the frontend and triggering scrape jobs.
   - Interacts directly with the database.

3. **Database Layer (Supabase PostgreSQL)**
   - Stores all application state including tracked products, price history, and scrape logs.
   
4. **Scraper Layer (Playwright)**
   - Runs headless browser sessions to extract real-time data from the INE mock store SPA.
   
5. **Scheduling Layer (cron-job.org)**
   - Periodically triggers the API's secure scraping endpoint to maintain up-to-date prices.

## Data Flow Diagrams

- **Product Search Flow**
  User inputs query -> Frontend calls API -> API fetches from mock store / API uses scraper to search mock store -> API returns results -> Frontend displays.
  
- **Track Product Flow**
  User clicks "Track" -> Frontend calls POST API -> API inserts basic info to Supabase -> API triggers initial scrape -> Scraper saves price/stock to Supabase -> API returns success.
  
- **Manual Scrape Flow**
  User clicks "Scrape Now" -> Frontend calls POST API -> API executes Scraper Service -> Scraper Service logs attempt, updates price history -> API returns result.
  
- **Scheduled Scrape Flow**
  cron-job.org HTTP POST -> API `/api/scrape/all` (authenticates via header) -> Fetch all active products -> Loop sequentially -> Scrape each product -> Log results -> Return summary.
  
- **Price History Query Flow**
  User opens product details -> Frontend calls GET API -> API queries Supabase price history & logs -> Frontend renders chart and table.

## Database Schema

The database consists of 4 main tables:

1. **tracked_products**
   - `id` (UUID, PK)
   - `store_product_id` (String, Unique)
   - `name` (String)
   - `url` (String)
   - `image_url` (String)
   - `is_active` (Boolean)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

2. **prices**
   - `id` (UUID, PK)
   - `product_id` (UUID, FK -> tracked_products.id)
   - `price` (Numeric)
   - `stock_status` (String)
   - `created_at` (Timestamp)

3. **scrape_logs**
   - `id` (UUID, PK)
   - `product_id` (UUID, FK -> tracked_products.id)
   - `status` (String - SUCCESS/FAILED)
   - `attempt_count` (Integer)
   - `error_message` (Text)
   - `created_at` (Timestamp)

4. **scraper_jobs** (Optional tracking for overall cron runs)
   - `id` (UUID, PK)
   - `total_products` (Integer)
   - `success_count` (Integer)
   - `failed_count` (Integer)
   - `started_at` (Timestamp)
   - `completed_at` (Timestamp)

## Error Handling Strategy

1. **Scraper Level**: Retries recoverable errors. Validates scraped data rigorously. Fails safely without corrupting the DB.
2. **API Level**: Catches scraper failures, stores them in `scrape_logs`, and returns appropriate HTTP status codes (or success with empty data if manual).
3. **Database Level**: Constraints (e.g., numeric price) prevent bad data from being committed.
4. **Frontend Level**: Displays friendly error messages based on API responses. Handles network errors gracefully.
