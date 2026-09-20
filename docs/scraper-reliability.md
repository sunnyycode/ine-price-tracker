# Scraper Reliability

This document outlines how the scraper service ensures robust operation under various failure conditions.

## 1. Slow responses
- **What could go wrong**: Page takes too long to load, holding up the queue.
- **Detection**: Playwright navigation times out.
- **Response**: The scraper aborts the current page load, triggers a retry with backoff.
- **Logging**: "Navigation timeout" logged in `scrape_logs`.
- **Stored Data**: No new price data stored; previous data preserved.

## 2. Failed HTTP requests
- **What could go wrong**: The target server returns a 500, 502, or 503 error.
- **Detection**: Page response status code inspection.
- **Response**: Triggers the exponential backoff retry mechanism.
- **Logging**: Non-200 status code logged.
- **Stored Data**: Fails gracefully; no corrupt data saved.

## 3. Delayed JavaScript content
- **What could go wrong**: The SPA shell loads, but the actual product data takes a long time to fetch via XHR.
- **Detection**: Target elements (price/stock) do not appear within the element wait timeout (10s).
- **Response**: Element wait timeout error thrown; retried if within attempt limits.
- **Logging**: "Timeout waiting for selector" logged.
- **Stored Data**: Fails gracefully.

## 4. Temporary page errors
- **What could go wrong**: Target SPA shows a React error boundary or "Service Unavailable" message dynamically.
- **Detection**: Expected selectors aren't found, or explicit error boundary selectors are found.
- **Response**: Retry with backoff.
- **Logging**: Logged as a failed attempt.
- **Stored Data**: No data saved.

## 5. Page structure changes
- **What could go wrong**: The store owner redesigns the page, changing class names or IDs.
- **Detection**: Fallback selectors also fail to locate the price.
- **Response**: Fails immediately (after retries) because it's a persistent issue.
- **Logging**: Logs indicate missing DOM elements. Alerts developer to update scraper.
- **Stored Data**: Prevents saving arbitrary text as price.

## 6. Empty/invalid price
- **What could go wrong**: The scraper extracts empty text or random strings instead of a number.
- **Detection**: `validateScrapedData` function checks type and value.
- **Response**: Validation error thrown.
- **Logging**: "Validation failed: invalid price".
- **Stored Data**: No database insert.

## 7. Empty/invalid stock
- **What could go wrong**: Stock element missing or parsing fails.
- **Detection**: Validation function logic.
- **Response**: Can be configured to accept empty stock as "Unknown" or fail. Currently validates as string.
- **Logging**: Warning or error logged.
- **Stored Data**: Handled safely.

## 8. Network errors
- **What could go wrong**: Connection reset, DNS failure.
- **Detection**: Playwright throws network-level exception.
- **Response**: Retry with backoff.
- **Logging**: Network error details logged.
- **Stored Data**: No data saved.

## 9. Timeouts
- **What could go wrong**: Overall scrape job takes longer than the host allows (e.g., Render limits).
- **Detection**: Sequential processing tracks elapsed time; external job runner monitors total time.
- **Response**: Safely exits or relies on process termination.
- **Logging**: Partial success logs saved up to the timeout point.
- **Stored Data**: Safely committed per product.

## 10. Concurrent scraping safety
- **What could go wrong**: Multiple cron jobs trigger at once, duplicating work or overloading the target.
- **Detection/Response**: API endpoint can use a lock or status flag to reject overlapping requests.
- **Logging**: Logs "Job already in progress".
- **Stored Data**: Prevents duplicate DB writes.

## 11. Duplicate scrape protection
- **What could go wrong**: Scraping the same item multiple times unnecessarily.
- **Detection**: Check `updated_at` timestamps before scraping.
- **Response**: Skip if scraped too recently.
- **Logging**: "Skipped - recently scraped".
- **Stored Data**: Unchanged.

## 12. Data integrity guarantees
- **What could go wrong**: Corrupt strings written to numeric fields.
- **Detection**: Handled at the database level (Supabase strict types) and application level (validation).
- **Response**: Application catches and logs before database rejection.
- **Logging**: Validation errors.
- **Stored Data**: Relational integrity maintained.
