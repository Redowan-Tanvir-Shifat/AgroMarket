import pool from '../config/db.js';

async function updateView() {
  const sql = `
    CREATE OR REPLACE VIEW v_active_products AS
    SELECT 
      p.id,
      p.seller_id,
      p.category_id,
      p.title,
      p.title_bn,
      p.description,
      p.base_price_bdt,
      p.min_floor_price_bdt,
      p.stock_quantity,
      p.low_stock_threshold,
      p.harvest_date,
      p.max_shelf_life_days,
      p.unit,
      p.status,
      p.image_url,
      p.created_at,
      s.farm_name,
      s.division AS farm_division,
      s.district AS farm_district,
      s.upazila AS farm_upazila,
      s.rating_avg AS seller_rating,
      s.total_ratings AS seller_total_ratings,
      c.name_en AS category_name_en,
      c.name_bn AS category_name_bn,
      c.slug AS category_slug,
      (TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0) AS age_in_days,
      (CASE 
         WHEN p.status = 'EXPIRED' THEN 0.00
         WHEN ((TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0) >= p.max_shelf_life_days) THEN 0.00 
         WHEN (((TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0) / p.max_shelf_life_days) <= 0.1) THEN p.base_price_bdt 
         ELSE GREATEST(p.min_floor_price_bdt, ROUND((p.base_price_bdt * (1 - ((((TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0) / p.max_shelf_life_days) - 0.1) * 0.7))), 2)) 
       END) AS current_dynamic_price_bdt,
      (CASE 
         WHEN p.status = 'EXPIRED' THEN 'EXPIRED'
         WHEN ((TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0) >= p.max_shelf_life_days) THEN 'EXPIRED' 
         WHEN (p.stock_quantity <= 0) THEN 'OUT_OF_STOCK' 
         WHEN (p.stock_quantity <= p.low_stock_threshold) THEN 'LOW_STOCK' 
         ELSE 'ACTIVE' 
       END) AS computed_status
    FROM products p
    JOIN sellers s ON p.seller_id = s.id
    JOIN categories c ON p.category_id = c.id;
  `;
  await pool.query(sql);
  console.log('View v_active_products successfully updated!');
  process.exit();
}

updateView().catch(e => {
  console.error(e);
  process.exit(1);
});
