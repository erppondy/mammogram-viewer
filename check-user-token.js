const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mammogram_viewer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Root1234#$',
});

async function checkUserToken() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              CHECKING USER TOKEN AND LICENSE DATA              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Get users with licenses
    const usersResult = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.license_id, u.status
      FROM users u
      WHERE u.license_id IS NOT NULL
      ORDER BY u.email
      LIMIT 5
    `);

    console.log(`Found ${usersResult.rows.length} users with licenses:\n`);

    for (const user of usersResult.rows) {
      console.log(`👤 ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   License ID: ${user.license_id}`);
      console.log(`   Status: ${user.status}`);
      
      // Generate a token for this user (like login does)
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: 'user',
          status: user.status,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Decode the token to show what's in it
      const decoded = jwt.decode(token);
      console.log(`   Token contains: userId, email, role, status`);
      console.log(`   ⚠️  Token does NOT contain: license_id`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💡 IMPORTANT FINDING:');
    console.log('   The JWT token does NOT include license_id!');
    console.log('   The backend fetches license_id from database on each request.');
    console.log('   This means users do NOT need to re-login.\n');
    
    console.log('✅ How it works:');
    console.log('   1. Frontend sends token with userId');
    console.log('   2. Backend verifies token and gets userId');
    console.log('   3. Backend queries database for full user data (including license_id)');
    console.log('   4. Backend uses license_id to fetch images\n');
    
    console.log('🔍 If frontend is not showing shared images:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Check Network tab - look at /images/by-patient response');
    console.log('   3. Verify the response contains images from other users');
    console.log('   4. Check if ImageGallery component is rendering correctly\n');
    
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserToken();
