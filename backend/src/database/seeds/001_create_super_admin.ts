import bcrypt from 'bcrypt';
import { query } from '../../config/database';
import dotenv from 'dotenv';

dotenv.config();

export async function createDefaultSuperAdmin(): Promise<void> {
  console.log('Creating default super admin account...');

  try {
    // Read super admin credentials from environment variables
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@mammogram-viewer.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
    const fullName = process.env.SUPER_ADMIN_USERNAME || 'Super Admin';

    // Check if super admin already exists
    const existingResult = await query(
      'SELECT id FROM users WHERE email = $1 OR role = $2',
      [email, 'super_admin']
    );

    if (existingResult.rows.length > 0) {
      console.log('Super admin already exists. Skipping creation.');
      return;
    }

    // Create super admin with hashed password
    const hashedPassword = await bcrypt.hash(password, 12);

    await query(
      `INSERT INTO users (email, password_hash, full_name, role, status, is_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [email, hashedPassword, fullName, 'super_admin', 'approved', true]
    );

    console.log('✓ Super admin created successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  createDefaultSuperAdmin()
    .then(() => {
      console.log('Super admin creation complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Super admin creation failed:', error);
      process.exit(1);
    });
}
