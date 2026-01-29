const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkAdminLicense() {
  try {
    console.log('=== CHECKING ADMIN LICENSE STATUS ===');
    
    // First, find the admin user
    const userResult = await pool.query(
      "SELECT id, email, full_name, license_id, ambulance_role FROM users WHERE email = 'admin@mammogram-viewer.com'"
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 Admin User:', {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      licenseId: user.license_id,
      ambulanceRole: user.ambulance_role
    });
    
    if (!user.license_id) {
      console.log('❌ Admin user has no license assigned');
      return;
    }
    
    // Check the license
    const licenseResult = await pool.query(
      "SELECT id, license_key, ambulance_name, status, created_at FROM ambulance_licenses WHERE id = $1",
      [user.license_id]
    );
    
    if (licenseResult.rows.length === 0) {
      console.log('❌ License not found');
      return;
    }
    
    const license = licenseResult.rows[0];
    console.log('📄 License Details:', {
      id: license.id,
      licenseKey: license.license_key,
      ambulanceName: license.ambulance_name,
      status: license.status,
      createdAt: license.created_at
    });
    
    if (license.status !== 'active') {
      console.log('🔧 FIXING: Setting license status to active...');
      await pool.query(
        "UPDATE ambulance_licenses SET status = 'active' WHERE id = $1",
        [license.id]
      );
      console.log('✅ License status updated to active');
    } else {
      console.log('✅ License is already active');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdminLicense();