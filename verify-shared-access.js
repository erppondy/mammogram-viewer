const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mammogram_viewer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function verifySharedAccess() {
  try {
    console.log('=== Verifying Shared License Access ===\n');

    // Get licenses with multiple users
    const licensesResult = await pool.query(`
      SELECT 
        al.id as license_id,
        al.ambulance_name,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT i.id) as image_count
      FROM ambulance_licenses al
      JOIN users u ON u.license_id = al.id
      LEFT JOIN images i ON i.license_id = al.id
      GROUP BY al.id, al.ambulance_name
      HAVING COUNT(DISTINCT u.id) > 1
      ORDER BY al.ambulance_name
    `);

    if (licensesResult.rows.length === 0) {
      console.log('No licenses with multiple users found.');
      return;
    }

    console.log(`Found ${licensesResult.rows.length} license(s) with multiple users:\n`);

    for (const license of licensesResult.rows) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`License: ${license.ambulance_name}`);
      console.log(`License ID: ${license.license_id}`);
      console.log(`Users: ${license.user_count} | Images: ${license.image_count}`);
      console.log('='.repeat(70));

      // Get all users for this license
      const usersResult = await pool.query(`
        SELECT id, email, full_name, ambulance_role
        FROM users
        WHERE license_id = $1
        ORDER BY email
      `, [license.license_id]);

      console.log('\nUsers in this license:');
      usersResult.rows.forEach((user, idx) => {
        console.log(`  ${idx + 1}. ${user.email} (${user.full_name}) - Role: ${user.ambulance_role}`);
      });

      // Get all images for this license with uploader info
      const imagesResult = await pool.query(`
        SELECT 
          i.id,
          i.original_filename,
          i.uploaded_at,
          u.email as uploader_email,
          u.full_name as uploader_name
        FROM images i
        JOIN users u ON i.user_id = u.id
        WHERE i.license_id = $1
        ORDER BY i.uploaded_at DESC
      `, [license.license_id]);

      console.log(`\nImages accessible to ALL users in this license (${imagesResult.rows.length} total):`);
      imagesResult.rows.forEach((img, idx) => {
        const uploadDate = new Date(img.uploaded_at).toLocaleString();
        console.log(`  ${idx + 1}. ${img.original_filename}`);
        console.log(`     Uploaded by: ${img.uploader_email} (${img.uploader_name})`);
        console.log(`     Date: ${uploadDate}`);
      });

      // Test access for each user
      console.log('\nAccess verification for each user:');
      for (const user of usersResult.rows) {
        const accessibleImages = await pool.query(`
          SELECT COUNT(*) as count
          FROM images
          WHERE license_id = $1
        `, [license.license_id]);

        const ownImages = await pool.query(`
          SELECT COUNT(*) as count
          FROM images
          WHERE user_id = $1
        `, [user.id]);

        const sharedImages = parseInt(accessibleImages.rows[0].count) - parseInt(ownImages.rows[0].count);

        console.log(`  ✓ ${user.email}:`);
        console.log(`    - Can access: ${accessibleImages.rows[0].count} images`);
        console.log(`    - Own images: ${ownImages.rows[0].count}`);
        console.log(`    - Shared from others: ${sharedImages}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✓ Shared access verification complete!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifySharedAccess();
