import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { createDefaultSuperAdmin } from './seeds/001_create_super_admin';

export async function seedDatabase(): Promise<void> {
  console.log('Seeding database with test data...');

  try {
    // Create super admin account
    await createDefaultSuperAdmin();

    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);

    await query(
      `INSERT INTO users (email, password_hash, full_name, professional_credentials, is_verified, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      ['test@example.com', hashedPassword, 'Dr. Test User', 'MD, Radiologist', true, 'user', 'approved']
    );

    console.log('Test user created: test@example.com / testpassword123');
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database seeding failed:', error);
      process.exit(1);
    });
}
