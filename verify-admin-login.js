const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function verifyAdminLogin() {
  try {
    console.log('=== VERIFYING ADMIN LOGIN READINESS ===');
    
    // Check user and license
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.full_name,
        u.role,
        u.status as user_status,
        u.license_id,
        u.ambulance_role,
        l.license_key,
        l.ambulance_name,
        l.status as license_status
      FROM users u
      LEFT JOIN ambulance_licenses l ON u.license_id = l.id
      WHERE u.email = 'admin@mammogram-viewer.com'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const admin = result.rows[0];
    console.log('👤 Admin Details:', {
      userId: admin.user_id,
      email: admin.email,
      fullName: admin.full_name,
      role: admin.role,
      userStatus: admin.user_status,
      ambulanceRole: admin.ambulance_role,
      licenseId: admin.license_id,
      licenseKey: admin.license_key,
      ambulanceName: admin.ambulance_name,
      licenseStatus: admin.license_status
    });
    
    // Check login readiness
    let canLogin = true;
    const issues = [];
    
    if (admin.user_status !== 'approved') {
      issues.push(`User status is '${admin.user_status}' (should be 'approved')`);
      canLogin = false;
    }
    
    if (admin.license_id && admin.license_status !== 'active') {
      issues.push(`License status is '${admin.license_status}' (should be 'active')`);
      canLogin = false;
    }
    
    if (canLogin) {
      console.log('✅ Admin should be able to login successfully!');
    } else {
      console.log('❌ Login issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyAdminLogin();