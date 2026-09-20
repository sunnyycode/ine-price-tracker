# Design Note

## 1. Why Playwright was chosen
- The mock store is a React SPA.
- All content is rendered via JavaScript on the client side.
- There is no server-side rendering, and no public API we can directly consume for prices reliably.
- Static HTTP requests (e.g., using Axios or Fetch) return only an empty `<div id="root">`.
- Playwright allows us to load the page, render the JavaScript, and extract the real DOM content.

## 2. When HTTP fetching would be preferred
- Server-rendered pages with complete HTML content on initial load.
- Sites providing official public APIs.
- Static product pages.
- When performance and resource efficiency matter significantly more than JavaScript rendering capabilities.

## 3. Retry Strategy
- **Exponential backoff**: Initial retry immediately, followed by 2s, then 5s delays.
- **Max 3 attempts** per scrape action.
- **Selective retries**: Only retry recoverable errors like timeouts, network issues, or 5xx server errors.
- **No retries for permanent errors**: 404 Not Found or clearly invalid URLs fail immediately.
- **Logging**: Each attempt is logged separately in the database to track intermittent issues.

## 4. Timeout Strategy
- **Navigation timeout**: 15 seconds max to load the page.
- **Element wait timeout**: 10 seconds max to wait for specific DOM elements to appear.
- This prevents the scraper from hanging indefinitely on slow responses or infinite loading states.

## 5. Data Validation
- Price must exist, must be numeric, and must be >= 0.
- Stock must be a valid non-empty string (or handled specifically if out of stock).
- Never save empty, null, or otherwise invalid data to the database.
- Never overwrite valid historical data with a failed scrape result.

## 6. Failure Handling
- Failed scrapes are strictly logged (not hidden) in the `scrape_logs` table.
- The previous valid price is preserved; no invalid price history row is inserted.
- Error messages are stored in detail to assist with debugging.

## 7. Why External Cron
- Free-tier hosting on Render puts services to sleep after 15 minutes of inactivity.
- Native `setInterval` or node-cron would not survive these service restarts.
- `cron-job.org` provides a reliable external HTTP trigger.
- The external ping wakes up the service (if asleep) and guarantees the scrape job executes on schedule.

## 8. How Incorrect Data is Prevented
- All extracted text is piped through a strict validation function before storage.
- No 0 (if inappropriate) or null prices are saved.
- Scrape logs track every attempt honestly to identify if incorrect data parsing is occurring.

## 9. Page Structure Change Detection
- If the expected DOM selectors are not found within the timeout, the scrape is marked as FAILED.
- Meaningful error messages are logged.
- The system tries multiple selector strategies as fallbacks where possible.
- This ensures silent data corruption does not occur (e.g., saving "0" because the price field moved).

## 10. Trade-offs
- **Playwright vs HTTP**: Playwright is heavier on memory and CPU, but absolutely necessary for an SPA.
- **Sequential vs Parallel Scraping**: Sequential is slower but prevents rate limiting or IP bans from the target server, and keeps memory usage low.
- **External Cron vs Internal**: Adds a minor dependency but ensures reliability on free-tier hosting.

## 11. AI-Assisted Development and Corrections

[TO BE FILLED BY DEVELOPER]
### What AI generated initially
[Your notes here]

### What was incorrect
[Your notes here]

### How I tested it
[Your notes here]

### How I corrected it
[Your notes here]
