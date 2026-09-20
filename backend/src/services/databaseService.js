const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function getTrackedProducts() {
  const { data, error } = await supabase
    .from('tracked_products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function getTrackedProductById(id) {
  const { data, error } = await supabase
    .from('tracked_products')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function getTrackedProductByStoreId(storeProductId) {
  const { data, error } = await supabase
    .from('tracked_products')
    .select('*')
    .eq('store_product_id', storeProductId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function insertTrackedProduct(product) {
  const { storeProductId, name, url, imageUrl } = product;
  const { data, error } = await supabase
    .from('tracked_products')
    .insert([{
      store_product_id: storeProductId,
      name,
      url,
      image_url: imageUrl,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateProductPrice(id, price, stock) {
  const { data, error } = await supabase
    .from('tracked_products')
    .update({
      current_price: price,
      current_stock: stock,
      last_scraped_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function insertPriceHistory(productId, price, stock, currency = 'USD') {
  const { data, error } = await supabase
    .from('price_history')
    .insert([{
      tracked_product_id: productId,
      price,
      stock,
      currency,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function insertScrapeLog(log) {
  const { data, error } = await supabase
    .from('scrape_logs')
    .insert([log])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getScrapeLogs(productId, limit = 50) {
  const { data, error } = await supabase
    .from('scrape_logs')
    .select('*')
    .eq('tracked_product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

async function getPriceHistory(productId) {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('tracked_product_id', productId)
    .order('scraped_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function createScrapeRun(triggerType, totalProducts) {
  const { data, error } = await supabase
    .from('scrape_runs')
    .insert([{
      trigger_type: triggerType,
      total_products: totalProducts,
      status: 'RUNNING',
    }])
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

async function updateScrapeRun(id, updates) {
  const { data, error } = await supabase
    .from('scrape_runs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deactivateProduct(id) {
  const { data, error } = await supabase
    .from('tracked_products')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  getTrackedProducts,
  getTrackedProductById,
  getTrackedProductByStoreId,
  insertTrackedProduct,
  updateProductPrice,
  insertPriceHistory,
  insertScrapeLog,
  getScrapeLogs,
  getPriceHistory,
  createScrapeRun,
  updateScrapeRun,
  deactivateProduct,
};
