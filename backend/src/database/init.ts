import fs from 'fs';
import path from 'path';
import { query, testConnection } from '../config/database';

export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database...');

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    throw new Error('Failed to connect to database');
  }

  try {
    // Get all migration files in order
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration(s) to execute`);

    // Execute each migration file
    for (const migrationFile of migrationFiles) {
      console.log(`Executing migration: ${migrationFile}`);
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await query(statement);
      }

      console.log(`✓ Migration ${migrationFile} completed`);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}
