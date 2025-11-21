# Database Setup Guide

## Prerequisites

- PostgreSQL 14 or higher installed
- Database user with CREATE DATABASE privileges

## Quick Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mammogram_viewer;

# Exit psql
\q
```

### 2. Configure Environment

Copy the `.env.example` file to `.env` and update the database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mammogram_viewer
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 3. Initialize Database Schema

Run the initialization script to create all tables and indexes:

```bash
npm run db:init
```

This will:
- Enable UUID extension
- Create all tables (users, images, image_metadata, upload_sessions, audit_logs)
- Create all necessary indexes
- Set up foreign key relationships

### 4. Seed Test Data (Optional)

To add a test user for development:

```bash
npm run db:seed
```

This creates a test user:
- Email: `test@example.com`
- Password: `testpassword123`

### 5. Complete Setup

Run both initialization and seeding in one command:

```bash
npm run db:setup
```

## Database Schema

### Tables

#### users
Stores user account information
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `full_name` (VARCHAR)
- `professional_credentials` (VARCHAR)
- `is_verified` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `last_login_at` (TIMESTAMP)

#### images
Stores image file metadata
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `original_filename` (VARCHAR)
- `file_format` (VARCHAR)
- `file_size` (BIGINT)
- `storage_path` (VARCHAR)
- `thumbnail_path` (VARCHAR)
- `uploaded_at` (TIMESTAMP)

#### image_metadata
Stores extracted metadata from images
- `id` (UUID, Primary Key)
- `image_id` (UUID, Foreign Key → images)
- `patient_id` (VARCHAR)
- `patient_name` (VARCHAR)
- `study_date` (DATE)
- `study_description` (TEXT)
- `modality` (VARCHAR)
- `image_width` (INTEGER)
- `image_height` (INTEGER)
- `bit_depth` (INTEGER)
- `color_space` (VARCHAR)
- `dicom_tags` (JSONB)
- `custom_tags` (JSONB)

#### upload_sessions
Tracks chunked upload progress
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `filename` (VARCHAR)
- `file_size` (BIGINT)
- `uploaded_bytes` (BIGINT)
- `chunk_size` (INTEGER)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)

#### audit_logs
Records all user actions for security
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `action` (VARCHAR)
- `resource_type` (VARCHAR)
- `resource_id` (UUID)
- `ip_address` (INET)
- `user_agent` (TEXT)
- `created_at` (TIMESTAMP)

## Indexes

The schema includes optimized indexes for:
- User email lookups
- Image queries by user and date
- Metadata searches (patient ID, study date, modality)
- JSONB field queries (DICOM tags)
- Upload session status tracking
- Audit log queries

## Connection Pooling

The application uses connection pooling with the following configuration:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

## Troubleshooting

### Connection Failed

If you see "Database connection failed":

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check credentials in `.env` file

3. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### Permission Denied

If you get permission errors:

```bash
# Grant privileges to your user
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE mammogram_viewer TO your_user;
```

### Reset Database

To completely reset the database:

```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE mammogram_viewer;
CREATE DATABASE mammogram_viewer;
\q

# Re-run setup
npm run db:setup
```

## Migrations

Future schema changes should be added as new migration files:
- `backend/src/database/migrations/002_*.sql`
- `backend/src/database/migrations/003_*.sql`

Each migration should be idempotent (safe to run multiple times).
