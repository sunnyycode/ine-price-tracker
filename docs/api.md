# API Documentation

### GET /api/health
- **Description**: Health check endpoint to verify API status.
- **Response**: 
  ```json
  { "success": true, "message": "API is running", "timestamp": "2023-10-25T12:00:00.000Z" }
  ```

### GET /api/products/search?q={query}
- **Description**: Search products from mock store.
- **Query params**: `q` (string, required, min 2 chars)
- **Response**: 
  ```json
  { "success": true, "products": [{ "id": "1", "name": "Laptop", "price": 999.99 }] }
  ```
- **Error**: 
  ```json
  { "success": false, "error": "Query must be at least 2 characters" }
  ```

### GET /api/tracked-products
- **Description**: Get all tracked products.
- **Response**: 
  ```json
  { "success": true, "products": [{ "id": "uuid", "name": "Laptop", "is_active": true }] }
  ```

### POST /api/tracked-products
- **Description**: Start tracking a product.
- **Body**: 
  ```json
  { "storeProductId": "123", "name": "Laptop", "url": "http://...", "imageUrl": "http://..." }
  ```
- **Response**: 
  ```json
  { "success": true, "product": { "id": "uuid", "name": "Laptop" } }
  ```
- **Error (duplicate)**: 
  ```json
  { "success": false, "error": "Product already tracked" }
  ```

### GET /api/tracked-products/:id
- **Description**: Get single tracked product details.
- **Response**: 
  ```json
  { "success": true, "product": { "id": "uuid", "name": "Laptop" } }
  ```

### GET /api/tracked-products/:id/history
- **Description**: Get price history for a product.
- **Response**: 
  ```json
  { "success": true, "history": [{ "price": 999.99, "created_at": "..." }] }
  ```

### GET /api/tracked-products/:id/logs
- **Description**: Get scrape logs for a product.
- **Response**: 
  ```json
  { "success": true, "logs": [{ "status": "SUCCESS", "attempt_count": 1, "created_at": "..." }] }
  ```

### POST /api/tracked-products/:id/scrape
- **Description**: Manually trigger a scrape for a single product.
- **Response**: 
  ```json
  { "success": true, "price": 999.99, "stock": "In Stock", "logs": [...] }
  ```

### POST /api/scrape/all
- **Description**: Scrape all active tracked products. Intended to be called by external cron.
- **Auth**: Header `Authorization: Bearer CRON_SECRET`
- **Response**: 
  ```json
  { "success": true, "summary": { "total": 10, "successful": 9, "failed": 1 } }
  ```
