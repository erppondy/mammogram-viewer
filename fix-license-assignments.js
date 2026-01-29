#!/usr/bin/env node

/**
 * Script to check and fix license assignments for users
 * This ensures users can share images with others in their license
 */

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mammogram_viewer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Root1234#$',
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Check current state
    console.log('📊 Current State:');
    console.log('='.repeat(80));

    const usersResult = await client.query(`
      SELECT id, email, full_name, license_id, role, status
      FROM users
      ORDER BY id
    `);

    console.log(`\nTotal Users: ${usersResult.rows.length}\n`);
    
    usersResult.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   License: ${user.license_id || '❌ NO LICENSE'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log('');
    });

    // Step 2: Check licenses
    console.log('\n📋 Available Licenses:');
    console.log('='.repeat(80));

    const licensesResult = await client.query(`
      SELECT id, license_key, ambulance_name, status, upload_quota
      FROM ambulance_licenses
      ORDER BY created_at DESC
    `);

    if (licensesResult.rows.length === 0) {
      console.log('❌ No licenses found in database');
      console.log('\n💡 You need to create a license first!');
      console.log('   Options:');
      console.log('   1. Use the Super Admin dashboard to create a license');
      console.log('   2. Run this SQL:');
      console.log(`
      INSERT INTO ambulance_licenses (
        license_key, 
        ambulance_name, 
        ambulance_contact_email,
        status, 
        upload_quota,
        issued_at,
        expires_at
      ) VALUES (
        'LIC-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
        'Test Organization',
        'admin@test.com',
        'active',
        1000,
        NOW(),
        NOW() + INTERVAL '1 year'
      ) RETURNING *;
      `);
    } else {
      licensesResult.rows.forEach((license, idx) => {
        console.log(`${idx + 1}. ${license.license_key}`);
        console.log(`   ID: ${license.id}`);
        console.log(`   Organization: ${license.ambulance_name}`);
        console.log(`   Status: ${license.status}`);
        console.log(`   Upload Quota: ${license.upload_quota}`);
        console.log('');
      });

      // Step 3: Check images
      console.log('\n📸 Images Status:');
      console.log('='.repeat(80));

      const imagesResult = await client.query(`
        SELECT 
          COUNT(*) as total_images,
          COUNT(license_id) as images_with_license,
          COUNT(*) - COUNT(license_id) as images_without_license
        FROM images
      `);

      const stats = imagesResult.rows[0];
      console.log(`Total Images: ${stats.total_images}`);
      console.log(`Images with License: ${stats.images_with_license}`);
      console.log(`Images without License: ${stats.images_without_license}`);

      // Step 4: Offer to fix
      console.log('\n\n🔧 Fix Options:');
      console.log('='.repeat(80));

      const usersWithoutLicense = usersResult.rows.filter(u => !u.license_id);
      
      if (usersWithoutLicense.length > 0 && licensesResult.rows.length > 0) {
        console.log(`\nFound ${usersWithoutLicense.length} users without licenses`);
        console.log(`Found ${licensesResult.rows.length} available licenses`);
        
        const defaultLicense = licensesResult.rows[0];
        console.log(`\n💡 Suggested Action: Assign all users to license "${defaultLicense.license_key}"`);
        console.log('\nTo assign users to this license, run:');
        console.log(`
UPDATE users 
SET license_id = '${defaultLicense.id}'
WHERE license_id IS NULL;

-- Then backfill images with license IDs
UPDATE images i
SET license_id = u.license_id
FROM users u
WHERE i.user_id = u.id
AND u.license_id IS NOT NULL
AND i.license_id IS NULL;
        `);

        // Auto-fix option
        const autoFix = process.argv.includes('--fix');
        if (autoFix) {
          console.log('\n🔄 Auto-fixing (--fix flag detected)...\n');
          
          // Assign users to license
          const updateUsers = await client.query(
            `UPDATE users 
             SET license_id = $1
             WHERE license_id IS NULL
             RETURNING id, email`,
            [defaultLicense.id]
          );
          
          console.log(`✅ Assigned ${updateUsers.rows.length} users to license ${defaultLicense.license_key}`);
          updateUsers.rows.forEach(u => {
            console.log(`   - ${u.email}`);
          });

          // Backfill images
          const updateImages = await client.query(
            `UPDATE images i
             SET license_id = u.license_id
             FROM users u
             WHERE i.user_id = u.id
             AND u.license_id IS NOT NULL
             AND i.license_id IS NULL
             RETURNING i.id`
          );

          console.log(`\n✅ Updated ${updateImages.rows.length} images with license IDs`);
          
          console.log('\n🎉 Fix complete! Users should now be able to see shared images.');
        } else {
          console.log('\n💡 To automatically apply this fix, run:');
          console.log('   node fix-license-assignments.js --fix');
        }
      } else if (usersWithoutLicense.length === 0) {
        console.log('✅ All users already have licenses assigned!');
        
        // Check if images need license IDs
        if (stats.images_without_license > 0) {
          console.log(`\n⚠️ But ${stats.images_without_license} images are missing license IDs`);
          console.log('\nTo fix, run:');
          console.log(`
UPDATE images i
SET license_id = u.license_id
FROM users u
WHERE i.user_id = u.id
AND u.license_id IS NOT NULL
AND i.license_id IS NULL;
          `);
          
          if (process.argv.includes('--fix')) {
            console.log('\n🔄 Fixing images...\n');
            const updateImages = await client.query(
              `UPDATE images i
               SET license_id = u.license_id
               FROM users u
               WHERE i.user_id = u.id
               AND u.license_id IS NOT NULL
               AND i.license_id IS NULL
               RETURNING i.id`
            );
            console.log(`✅ Updated ${updateImages.rows.length} images with license IDs`);
          }
        } else {
          console.log('✅ All images have license IDs!');
          console.log('\n🎉 Everything looks good! License sharing should be working.');
        }
      }
    }

    // Step 5: Show sharing summary
    console.log('\n\n📊 License Sharing Summary:');
    console.log('='.repeat(80));

    const sharingResult = await client.query(`
      SELECT 
        l.license_key,
        l.ambulance_name,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT i.id) as image_count
      FROM ambulance_licenses l
      LEFT JOIN users u ON u.license_id = l.id
      LEFT JOIN images i ON i.license_id = l.id
      WHERE l.status = 'active'
      GROUP BY l.id, l.license_key, l.ambulance_name
      ORDER BY user_count DESC
    `);

    if (sharingResult.rows.length > 0) {
      sharingResult.rows.forEach((row, idx) => {
        console.log(`\n${idx + 1}. License: ${row.license_key}`);
        console.log(`   Organization: ${row.ambulance_name}`);
        console.log(`   Users: ${row.user_count}`);
        console.log(`   Shared Images: ${row.image_count}`);
        
        if (row.user_count > 1 && row.image_count > 0) {
          console.log(`   ✅ Sharing enabled (${row.user_count} users can see ${row.image_count} images)`);
        } else if (row.user_count <= 1) {
          console.log(`   ⚠️ Only 1 user - no sharing possible`);
        } else if (row.image_count === 0) {
          console.log(`   ⚠️ No images uploaded yet`);
        }
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

main();
