# Complete Deployment Guide: Render + Vercel + cron-job.org

This step-by-step guide explains how to deploy the **INE Product Price Tracker** to production using free-tier services.

---

## Architecture in Production

```
┌─────────────────┐       API Calls       ┌────────────────────────┐
│  React Frontend │ ────────────────────> │  Express Backend       │
│    (Vercel)     │                       │    (Render Web Svc)    │
└─────────────────┘                       └────────────────────────┘
                                            │                 │
                           Scrapes Store    │                 │ Saves Data
                                            ▼                 ▼
                                    ┌──────────────┐   ┌──────────────┐
                                    │  Mock Store  │   │   Supabase   │
                                    │ (Playwright) │   │ (PostgreSQL) │
                                    └──────────────┘   └──────────────┘
                                            ▲
                                            │ Every 2h
                                            │
                                    ┌──────────────┐
                                    │ cron-job.org │
                                    └──────────────┘
```

---

## Step 1: Push Code to GitHub

Since Render and Vercel automatically build from GitHub:

1. Open **[GitHub.com](https://github.com)** and create a new repository named `ine-price-tracker` (set it to **Public** or **Private**).
2. If you have **GitHub Desktop** or **Git** installed:
   - Commit and push the `ine-price-tracker` folder.
   *(Note: node_modules and .env are already in `.gitignore` and won't be pushed).*
3. Alternatively, you can drag and drop the files into GitHub or use GitHub CLI.

---

## Step 2: Deploy Backend to Render

1. Go to **[dashboard.render.com](https://dashboard.render.com)** and sign in.
2. Click **"New +"** &rarr; select **"Web Service"**.
3. Connect your GitHub repository: `ine-price-tracker`.
4. Configure the Web Service settings:
   - **Name**: `ine-price-tracker-backend`
   - **Region**: Choose closest to you (e.g. *Singapore* or *Frankfurt*)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx playwright install chromium
     ```
   - **Start Command**:
     ```bash
     node src/server.js
     ```
   - **Instance Type**: `Free`

5. Scroll down to **Environment Variables** and add the following 4 keys:
   | Key | Value |
   | :--- | :--- |
   | `SUPABASE_URL` | `https://qtooteioddointzfgvnh.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(your secret role key from Supabase Project Settings)* |
   | `CRON_SECRET` | `ine_cron_secret_tracker_2026` |
   | `MOCK_STORE_URL` | `https://demo.inelabteamdev.com` |

6. Click **"Deploy Web Service"**.
7. Once deployment finishes, Render will give you your backend URL, for example:
   `https://ine-price-tracker-backend.onrender.com`
8. Verify it by visiting:
   `https://ine-price-tracker-backend.onrender.com/api/health`
   *(It should return `{"success":true,"message":"API is running"}`)*.

---

## Step 3: Deploy Frontend to Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Import your `ine-price-tracker` GitHub repository.
4. Under **Project Configuration**:
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Framework Preset**: `Vite` (auto-detected).
   - **Build Command**: `vite build` (default).
   - **Output Directory**: `dist` (default).
5. Open **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://ine-price-tracker-backend.onrender.com` *(use your actual Render URL from Step 2)* |

6. Click **"Deploy"**.
7. In ~30 seconds, Vercel will give you a live production URL (e.g. `https://ine-price-tracker.vercel.app`).
8. Open the URL — your full dashboard is live!

---

## Step 4: Configure cron-job.org (Automated 2-Hour Scraping)

Because free-tier backends sleep when inactive, using an external scheduler wakes up the server and triggers the scrape.

1. Go to **[cron-job.org](https://cron-job.org)** and create a free account.
2. Click **"Create Cronjob"**.
3. Fill in the details:
   - **Title**: `INE Product Price Tracker`
   - **URL**: `https://<YOUR-RENDER-BACKEND-URL>/api/scrape/all`  
     *(e.g., `https://ine-price-tracker-backend.onrender.com/api/scrape/all`)*
   - **Schedule**:
     - Execution interval: **Every 2 hours** (or cron expression: `0 */2 * * *`)
   - **Request Method**: Select **`POST`**.
4. Click the **"Headers"** tab:
   - Click **"Add Header"**:
     - **Name**: `Authorization`
     - **Value**: `Bearer ine_cron_secret_tracker_2026`
   - Add a second header:
     - **Name**: `Content-Type`
     - **Value**: `application/json`
5. Click **"Save"**.
6. You can click **"Test run"** on cron-job.org immediately to verify it triggers and receives `200 OK`.

---

## Verification Checklist

- [ ] Backend health check responds: `GET /api/health` returns `200 OK`.
- [ ] Vercel frontend loads dashboard cards and tracked products from Supabase.
- [ ] Searching products from the Vercel app searches the mock store.
- [ ] Clicking "Track" stores the product in Supabase.
- [ ] Clicking "Scrape Now" runs the Playwright scraper on Render and logs the result.
- [ ] cron-job.org execution log shows successful 200 runs every 2 hours.
