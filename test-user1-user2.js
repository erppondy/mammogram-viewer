const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mammogram_viewer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testUser1User2() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         TESTING user1@gmail.com & user2@gmail.com             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Get user1 info
    const user1Result = await pool.query(`
      SELECT id, email, full_name, license_id, status
      FROM users
      WHERE email = 'user1@gmail.com'
    `);

    // Get user2 info
    const user2Result = await pool.query(`
      SELECT id, email, full_name, license_id, status
      FROM users
      WHERE email = 'user2@gmail.com'
    `);

    if (user1Result.rows.length === 0) {
      console.log('❌ user1@gmail.com not found in database');
      return;
    }

    if (user2Result.rows.length === 0) {
      console.log('❌ user2@gmail.com not found in database');
      return;
    }

    const user1 = user1Result.rows[0];
    const user2 = user2Result.rows[0];

    console.log('👤 User 1:');
    console.log(`   Email: ${user1.email}`);
    console.log(`   Name: ${user1.full_name}`);
    console.log(`   User ID: ${user1.id}`);
    console.log(`   License ID: ${user1.license_id || 'NONE'}`);
    console.log(`   Status: ${user1.status}\n`);

    console.log('👤 User 2:');
    console.log(`   Email: ${user2.email}`);
    console.log(`   Name: ${user2.full_name}`);
    console.log(`   User ID: ${user2.id}`);
    console.log(`   License ID: ${user2.license_id || 'NONE'}`);
    console.log(`   Status: ${user2.status}\n`);

    // Check if they share the same license
    if (!user1.license_id || !user2.license_id) {
      console.log('❌ One or both users do not have a license assigned!');
      console.log('   This is why they cannot see shared images.\n');
      return;
    }

    if (user1.license_id !== user2.license_id) {
      console.log('❌ Users have DIFFERENT licenses!');
      console.log(`   User1 license: ${user1.license_id}`);
      console.log(`   User2 license: ${user2.license_id}`);
      console.log('   They cannot see each other\'s images.\n');
      return;
    }

    console.log('✅ Users share the same license!');
    console.log(`   License ID: ${user1.license_id}\n`);

    // Get license info
    const licenseResult = await pool.query(`
      SELECT id, ambulance_name, status, expires_at
      FROM ambulance_licenses
      WHERE id = $1
    `, [user1.license_id]);

    if (licenseResult.rows.length > 0) {
      const license = licenseResult.rows[0];
      console.log('📋 License Details:');
      console.log(`   Name: ${license.ambulance_name}`);
      console.log(`   Status: ${license.status}`);
      console.log(`   Expires: ${new Date(license.expires_at).toLocaleDateString()}\n`);
    }

    // Get all images for this license
    const imagesResult = await pool.query(`
      SELECT 
        i.id,
        i.original_filename,
        i.user_id,
        i.license_id,
        u.email as uploader_email,
        u.full_name as uploader_name
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.license_id = $1
      ORDER BY i.uploaded_at DESC
    `, [user1.license_id]);

    console.log(`📁 Images in License (${imagesResult.rows.length} total):\n`);

    if (imagesResult.rows.length === 0) {
      console.log('   ⚠️  No images found in this license.');
      console.log('   Upload an image as user1, then login as user2 to test sharing.\n');
      return;
    }

    imagesResult.rows.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.original_filename}`);
      console.log(`      Uploaded by: ${img.uploader_email} (${img.uploader_name})`);
      console.log(`      User ID: ${img.user_id}`);
      console.log(`      License ID: ${img.license_id}`);
      
      if (img.user_id === user1.id) {
        console.log(`      ✓ user1 can see: YES (owner)`);
        console.log(`      ✓ user2 can see: YES (shared)`);
      } else if (img.user_id === user2.id) {
        console.log(`      ✓ user1 can see: YES (shared)`);
        console.log(`      ✓ user2 can see: YES (owner)`);
      } else {
        console.log(`      ✓ user1 can see: YES (shared)`);
        console.log(`      ✓ user2 can see: YES (shared)`);
      }
      console.log('');
    });

    // Test the actual API query that would be executed
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Testing API Query (what user2 would see):\n');

    const apiResult = await pool.query(`
      SELECT 
        i.id, 
        i.original_filename, 
        i.file_format, 
        i.file_size, 
        i.uploaded_at,
        i.thumbnail_path,
        i.user_id,
        u.email as uploader_email,
        u.full_name as uploader_name,
        COALESCE(m.patient_name, m.patient_id, 'Unknown Patient') as patient_folder,
        m.patient_name,
        m.patient_id
      FROM images i
      LEFT JOIN image_metadata m ON i.id = m.image_id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.license_id = $1
      ORDER BY patient_folder, i.uploaded_at DESC
    `, [user2.license_id]);

    console.log(`   API would return ${apiResult.rows.length} images for user2\n`);

    if (apiResult.rows.length > 0) {
      console.log('✅ DATABASE IS CORRECT - user2 should see these images!');
      console.log('\n   If user2 is NOT seeing images in the web interface:');
      console.log('   1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
      console.log('   2. Clear browser cache');
      console.log('   3. Logout and login again');
      console.log('   4. Try incognito/private mode');
      console.log('   5. Check browser console (F12) for errors');
      console.log('   6. Check Network tab for /images/by-patient response\n');
    } else {
      console.log('❌ API would return 0 images - there is a problem!\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testUser1User2();
