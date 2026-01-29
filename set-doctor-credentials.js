#!/usr/bin/env node

/**
 * Script to set user role to 'doctor'
 * This allows them to see and use the annotation feature
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
    const email = process.argv[2];

    if (!email) {
        console.log('Usage: node set-doctor-credentials.js <email>');
        console.log('');
        console.log('Examples:');
        console.log('  node set-doctor-credentials.js doctor@example.com');
        console.log('  node set-doctor-credentials.js user@example.com');
        console.log('');
        console.log('This will set the user role to "doctor" and allow them to use the annotation feature.');
        process.exit(1);
    }

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check if user exists
        const userCheck = await client.query(
            'SELECT id, email, full_name, role FROM users WHERE email = $1',
            [email]
        );

        if (userCheck.rows.length === 0) {
            console.log(`❌ User with email "${email}" not found`);
            process.exit(1);
        }

        const user = userCheck.rows[0];
        console.log('User found:');
        console.log(`  Name: ${user.full_name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Current role: ${user.role}`);
        console.log('');

        // Update role to doctor
        const result = await client.query(
            'UPDATE users SET role = $1 WHERE email = $2 RETURNING *',
            ['doctor', email]
        );

        console.log('✅ User role updated to "doctor"!');
        console.log('');
        console.log('🎉 This user can now see and use the annotation feature!');
        console.log('   (They may need to logout and login again for changes to take effect)');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

main();
