import pool from '../config/db.js';

async function migrate() {
  console.log('🔄 Running Phase 2 migration for Farmer Verification & Admin Governance...');
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM sellers');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('verification_status')) {
      await pool.query(
        "ALTER TABLE sellers ADD COLUMN verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'VERIFIED' AFTER nid_trade_license"
      );
      console.log('✅ Added verification_status column to sellers');
    }

    if (!colNames.includes('verification_notes')) {
      await pool.query(
        'ALTER TABLE sellers ADD COLUMN verification_notes TEXT NULL AFTER verification_status'
      );
      console.log('✅ Added verification_notes column to sellers');
    }

    // Set one seller to PENDING if all are VERIFIED, so Admin has a realistic pending queue to test
    const [pending] = await pool.query("SELECT id FROM sellers WHERE verification_status = 'PENDING'");
    if (pending.length === 0) {
      const [allSellers] = await pool.query('SELECT id FROM sellers ORDER BY id DESC LIMIT 1');
      if (allSellers.length > 0) {
        await pool.query("UPDATE sellers SET verification_status = 'PENDING' WHERE id = ?", [allSellers[0].id]);
        console.log(`✅ Set seller #${allSellers[0].id} to PENDING for admin review queue`);
      }
    }

    console.log('🎉 Phase 2 database updates complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
