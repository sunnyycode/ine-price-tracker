const { describe, it } = require('node:test');
const assert = require('node:assert');

// Mock validation function matching the described behavior
function validateScrapedData(price, stock) {
  if (price === null || price === undefined) return { valid: false, error: 'Price is null or undefined' };
  if (typeof price !== 'number' || isNaN(price)) return { valid: false, error: 'Price must be a valid number' };
  if (price < 0) return { valid: false, error: 'Price cannot be negative' };
  
  // Stock can be empty, we just ensure it's a string representation if provided
  const parsedStock = stock !== undefined && stock !== null ? String(stock) : '';

  return { valid: true, data: { price, stock: parsedStock } };
}

function extractPrice(text) {
  const match = text.match(/\$?\s*(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

describe('Scraper Validation Tests', () => {
  it('validateScrapedData - valid price and stock', () => {
    const result = validateScrapedData(99.99, 'In Stock');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.data.price, 99.99);
  });

  it('validateScrapedData - null price', () => {
    const result = validateScrapedData(null, 'In Stock');
    assert.strictEqual(result.valid, false);
  });

  it('validateScrapedData - negative price', () => {
    const result = validateScrapedData(-10, 'In Stock');
    assert.strictEqual(result.valid, false);
  });

  it('validateScrapedData - zero price (should be valid)', () => {
    const result = validateScrapedData(0, 'Out of Stock');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.data.price, 0);
  });

  it('validateScrapedData - non-numeric price', () => {
    const result = validateScrapedData('ninety-nine', 'In Stock');
    assert.strictEqual(result.valid, false);
  });

  it('validateScrapedData - empty stock (should still be valid, stock can be unknown)', () => {
    const result = validateScrapedData(49.99, '');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.data.stock, '');
  });

  it('Price extraction from sample text containing dollar amounts', () => {
    assert.strictEqual(extractPrice('The price is $129.50 today'), 129.5);
    assert.strictEqual(extractPrice('$999'), 999);
    assert.strictEqual(extractPrice('No price here'), null);
  });

  it('Stock extraction from sample text', () => {
    const extractStock = (text) => text.includes('In Stock') ? 'In Stock' : 'Out of Stock';
    assert.strictEqual(extractStock('Item is In Stock now'), 'In Stock');
    assert.strictEqual(extractStock('Item is currently Out of Stock'), 'Out of Stock');
  });
});
