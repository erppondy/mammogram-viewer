const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mammogram_viewer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Root1234#$',
});

async function testLicenseAccess() {
  try {
    console.log('=== Testing License Access Feature ===\n');

    // 1. Check users table structure
    console.log('1. Checking users table structure...');
    const usersColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('license_id', 'ambulance_role')
      ORDER BY column_name
    `);
    console.log('Users table columns:', usersColumns.rows);

    // 2. Check images table structure
    console.log('\n2. Checking images table structure...');
    const imagesColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'images' 
      AND column_name IN ('license_id', 'user_id')
      ORDER BY column_name
    `);
    console.log('Images table columns:', imagesColumns.rows);

    // 3. Get sample users with licenses
    console.log('\n3. Checking users with licenses...');
    const users = await pool.query(`
      SELECT id, email, full_name, license_id, ambulance_role 
      FROM users 
      WHERE license_id IS NOT NULL
      LIMIT 5
    `);
    console.log(`Found ${users.rows.length} users with licenses:`);
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, License: ${user.license_id}, Role: ${user.ambulance_role})`);
    });

    // 4. Get sample images with licenses
    console.log('\n4. Checking images with licenses...');
    const images = await pool.query(`
      SELECT i.id, i.original_filename, i.user_id, i.license_id, u.email as uploader_email
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.license_id IS NOT NULL
      LIMIT 5
    `);
    console.log(`Found ${images.rows.length} images with licenses:`);
    images.rows.forEach(img => {
      console.log(`  - ${img.original_filename} (Uploader: ${img.uploader_email}, License: ${img.license_id})`);
    });

    // 5. Check if there are images without license_id but user has license
    console.log('\n5. Checking for images missing license_id...');
    const missingLicense = await pool.query(`
      SELECT i.id, i.original_filename, i.user_id, i.license_id as image_license, 
             u.email, u.license_id as user_license
      FROM images i
      JOIN users u ON i.user_id = u.id
      WHERE u.license_id IS NOT NULL 
      AND i.license_id IS NULL
      LIMIT 10
    `);
    console.log(`Found ${missingLicense.rows.length} images where user has license but image doesn't:`);
    missingLicense.rows.forEach(img => {
      console.log(`  - ${img.original_filename} (User: ${img.email}, User License: ${img.user_license}, Image License: ${img.image_license})`);
    });

    // 6. Test shared access query
    if (users.rows.length >= 2) {
      const testUser = users.rows[0];
      console.log(`\n6. Testing shared access for user: ${testUser.email}`);
      console.log(`   User's license_id: ${testUser.license_id}`);
      
      const sharedImages = await pool.query(`
        SELECT i.id, i.original_filename, i.user_id, i.license_id, u.email as uploader_email
        FROM images i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.license_id = $1
        ORDER BY i.uploaded_at DESC
        LIMIT 10
      `, [testUser.license_id]);
      
      console.log(`   Found ${sharedImages.rows.length} images accessible to this user:`);
      sharedImages.rows.forEach(img => {
        console.log(`     - ${img.original_filename} (Uploaded by: ${img.uploader_email})`);
      });
    }

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testLicenseAccess();
