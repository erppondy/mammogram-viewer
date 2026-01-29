const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mammogram_viewer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Root1234#$',
});

async function fixImageLicenseIds() {
  const client = await pool.connect();
  
  try {
    console.log('=== Fixing Image License IDs ===\n');

    // Start transaction
    await client.query('BEGIN');

    // 1. Check how many images need fixing
    const checkResult = await client.query(`
      SELECT COUNT(*) as count
      FROM images i
      JOIN users u ON i.user_id = u.id
      WHERE u.license_id IS NOT NULL 
      AND i.license_id IS NULL
    `);
    
    const imagesToFix = parseInt(checkResult.rows[0].count);
    console.log(`Found ${imagesToFix} images that need license_id updated\n`);

    if (imagesToFix === 0) {
      console.log('No images need fixing. All done!');
      await client.query('ROLLBACK');
      return;
    }

    // 2. Show sample of what will be updated
    console.log('Sample of images to be updated:');
    const sampleResult = await client.query(`
      SELECT i.id, i.original_filename, u.email, u.license_id
      FROM images i
      JOIN users u ON i.user_id = u.id
      WHERE u.license_id IS NOT NULL 
      AND i.license_id IS NULL
      LIMIT 5
    `);
    
    sampleResult.rows.forEach(row => {
      console.log(`  - ${row.original_filename} (User: ${row.email}) -> License: ${row.license_id}`);
    });
    console.log('');

    // 3. Update all images to have the same license_id as their uploader
    console.log('Updating images...');
    const updateResult = await client.query(`
      UPDATE images i
      SET license_id = u.license_id
      FROM users u
      WHERE i.user_id = u.id
      AND u.license_id IS NOT NULL
      AND i.license_id IS NULL
    `);

    console.log(`✓ Updated ${updateResult.rowCount} images with license_id\n`);

    // 4. Verify the fix
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM images i
      JOIN users u ON i.user_id = u.id
      WHERE u.license_id IS NOT NULL 
      AND i.license_id IS NULL
    `);
    
    const remainingIssues = parseInt(verifyResult.rows[0].count);
    
    if (remainingIssues === 0) {
      console.log('✓ Verification passed: All images now have correct license_id');
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('✓ Changes committed to database\n');
      
      // Show summary by license
      console.log('Summary by license:');
      const summaryResult = await client.query(`
        SELECT 
          al.ambulance_name,
          al.id as license_id,
          COUNT(DISTINCT i.user_id) as user_count,
          COUNT(i.id) as image_count
        FROM ambulance_licenses al
        JOIN images i ON i.license_id = al.id
        GROUP BY al.id, al.ambulance_name
        ORDER BY al.ambulance_name
      `);
      
      summaryResult.rows.forEach(row => {
        console.log(`  ${row.ambulance_name}: ${row.image_count} images from ${row.user_count} users`);
      });
      
    } else {
      console.log(`⚠ Warning: ${remainingIssues} images still have issues`);
      await client.query('ROLLBACK');
      console.log('Changes rolled back');
    }

    console.log('\n=== Fix Complete ===');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error occurred, rolling back changes:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixImageLicenseIds();
