const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mammogram_viewer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Root1234#$',
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testAPIEndpoint() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║           TESTING API ENDPOINT - /images/by-patient           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Get a test user with a license
    const userResult = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.license_id
      FROM users u
      WHERE u.license_id IS NOT NULL
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No users with licenses found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`👤 Test User: ${user.email}`);
    console.log(`   License ID: ${user.license_id}\n`);

    // Simulate what the API endpoint does
    console.log('📡 Simulating API call: GET /images/by-patient\n');
    console.log('   SQL Query being executed:');
    console.log('   ----------------------------------------');
    console.log(`   SELECT i.*, m.patient_name, m.patient_id`);
    console.log(`   FROM images i`);
    console.log(`   LEFT JOIN image_metadata m ON i.id = m.image_id`);
    console.log(`   WHERE i.license_id = '${user.license_id}'`);
    console.log(`   ORDER BY patient_folder, i.uploaded_at DESC`);
    console.log('   ----------------------------------------\n');

    // Execute the actual query from the API
    const result = await pool.query(`
      SELECT 
        i.id, 
        i.original_filename, 
        i.file_format, 
        i.file_size, 
        i.uploaded_at,
        i.thumbnail_path,
        COALESCE(m.patient_name, m.patient_id, 'Unknown Patient') as patient_folder,
        m.patient_name,
        m.patient_id
      FROM images i
      LEFT JOIN image_metadata m ON i.id = m.image_id
      WHERE i.license_id = $1
      ORDER BY patient_folder, i.uploaded_at DESC
    `, [user.license_id]);

    console.log(`📊 Query Results: ${result.rows.length} images found\n`);

    if (result.rows.length === 0) {
      console.log('⚠️  No images found for this license.');
      console.log('   This could mean:');
      console.log('   1. No images have been uploaded yet');
      console.log('   2. Images exist but license_id is not set\n');
      
      // Check if there are images without license_id
      const orphanResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM images i
        JOIN users u ON i.user_id = u.id
        WHERE u.license_id = $1 AND i.license_id IS NULL
      `, [user.license_id]);
      
      const orphanCount = parseInt(orphanResult.rows[0].count);
      if (orphanCount > 0) {
        console.log(`   ❌ Found ${orphanCount} images that need license_id fixed!`);
        console.log('   Run: node fix-image-license-ids.js\n');
      }
      return;
    }

    // Group by patient folder (like the API does)
    const patientGroups = {};
    result.rows.forEach(row => {
      const folder = row.patient_folder;
      if (!patientGroups[folder]) {
        patientGroups[folder] = {
          patientName: row.patient_name,
          patientId: row.patient_id,
          images: [],
        };
      }
      patientGroups[folder].images.push({
        id: row.id,
        originalFilename: row.original_filename,
        fileFormat: row.file_format,
        fileSize: row.file_size,
        uploadedAt: row.uploaded_at,
        thumbnailPath: row.thumbnail_path,
      });
    });

    // Format response like the API
    const apiResponse = {
      patients: Object.entries(patientGroups).map(([folder, data]) => ({
        folder,
        patientName: data.patientName,
        patientId: data.patientId,
        imageCount: data.images.length,
        images: data.images,
      })),
    };

    console.log('✅ API Response Structure:');
    console.log('   {');
    console.log(`     patients: [ ${apiResponse.patients.length} folders ]`);
    console.log('   }\n');

    console.log('📁 Patient Folders:\n');
    apiResponse.patients.forEach((patient, idx) => {
      console.log(`   ${idx + 1}. ${patient.folder}`);
      console.log(`      Patient Name: ${patient.patientName || 'N/A'}`);
      console.log(`      Patient ID: ${patient.patientId || 'N/A'}`);
      console.log(`      Images: ${patient.imageCount}`);
      patient.images.forEach((img, imgIdx) => {
        console.log(`         ${imgIdx + 1}. ${img.originalFilename}`);
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ API endpoint should return this data correctly!');
    console.log('   If frontend is not showing images, check:');
    console.log('   1. Browser console for errors');
    console.log('   2. Network tab to see actual API response');
    console.log('   3. Authentication token is valid');
    console.log('   4. User is logged in with correct license\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAPIEndpoint();
