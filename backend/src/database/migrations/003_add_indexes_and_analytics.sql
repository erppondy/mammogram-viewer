-- Migration: Add indexes and analytics tables
-- Description: Optimize query performance and add analytics tracking

-- ============================================
-- PART 1: Add Indexes for Performance
-- ============================================

-- Images table indexes (using uploaded_at, not created_at)
CREATE INDEX IF NOT EXISTS idx_images_user_id_new ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at_desc ON images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_file_format_new ON images(file_format);
CREATE INDEX IF NOT EXISTS idx_images_user_uploaded ON images(user_id, uploaded_at DESC);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_new ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON users(created_at DESC);

-- Upload sessions indexes (already exist in initial schema, skip duplicates)
-- CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);
-- CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_created_desc ON upload_sessions(created_at DESC);

-- ============================================
-- PART 2: Analytics Tables
-- ============================================

-- Image views tracking
CREATE TABLE IF NOT EXISTS image_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration INTEGER, -- in seconds, optional
    CONSTRAINT fk_image_views_image FOREIGN KEY (image_id) REFERENCES images(id),
    CONSTRAINT fk_image_views_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_image_views_image_id ON image_views(image_id);
CREATE INDEX IF NOT EXISTS idx_image_views_user_id ON image_views(user_id);
CREATE INDEX IF NOT EXISTS idx_image_views_viewed_at ON image_views(viewed_at DESC);

-- User activity tracking
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'upload', 'view', 'download', 'delete'
    resource_type VARCHAR(50), -- 'image', 'user', etc.
    resource_id UUID,
    metadata JSONB, -- Additional context
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_activity_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON user_activity(user_id, created_at DESC);

-- Daily system statistics (aggregated)
CREATE TABLE IF NOT EXISTS system_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0, -- Users who performed any action
    new_users INTEGER DEFAULT 0,
    total_images INTEGER DEFAULT 0,
    new_images INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_uploads INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0, -- in bytes
    avg_upload_size BIGINT DEFAULT 0,
    dicom_count INTEGER DEFAULT 0,
    aan_count INTEGER DEFAULT 0,
    jpeg_count INTEGER DEFAULT 0,
    png_count INTEGER DEFAULT 0,
    tiff_count INTEGER DEFAULT 0,
    other_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(stat_date DESC);

-- Job queue tracking (for in-memory jobs)
CREATE TABLE IF NOT EXISTS job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(255) NOT NULL UNIQUE,
    job_type VARCHAR(50) NOT NULL, -- 'dicom_conversion', 'thumbnail_generation', etc.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resource_id UUID, -- image_id or other resource
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    data JSONB, -- Job input data
    result JSONB, -- Job result data
    error TEXT, -- Error message if failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_job_queue_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_job_queue_job_id ON job_queue(job_id);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_user_id ON job_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_job_queue_created_at ON job_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_queue_type_status ON job_queue(job_type, status);

-- ============================================
-- PART 3: Helper Functions
-- ============================================

-- Function to update system stats
CREATE OR REPLACE FUNCTION update_system_stats(target_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO system_stats (
        stat_date,
        total_users,
        active_users,
        new_users,
        total_images,
        new_images,
        total_views,
        total_uploads,
        total_downloads,
        storage_used,
        dicom_count,
        aan_count,
        jpeg_count,
        png_count,
        tiff_count,
        other_count
    )
    SELECT
        target_date,
        (SELECT COUNT(*) FROM users WHERE status = 'approved'),
        (SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM images),
        (SELECT COUNT(*) FROM images WHERE DATE(uploaded_at) = target_date),
        (SELECT COUNT(*) FROM image_views WHERE DATE(viewed_at) = target_date),
        (SELECT COUNT(*) FROM user_activity WHERE activity_type = 'upload' AND DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM user_activity WHERE activity_type = 'download' AND DATE(created_at) = target_date),
        (SELECT COALESCE(SUM(file_size), 0) FROM images),
        (SELECT COUNT(*) FROM images WHERE file_format IN ('dcm', 'dicom')),
        (SELECT COUNT(*) FROM images WHERE file_format = 'aan'),
        (SELECT COUNT(*) FROM images WHERE file_format IN ('jpg', 'jpeg')),
        (SELECT COUNT(*) FROM images WHERE file_format = 'png'),
        (SELECT COUNT(*) FROM images WHERE file_format IN ('tif', 'tiff')),
        (SELECT COUNT(*) FROM images WHERE file_format NOT IN ('dcm', 'dicom', 'aan', 'jpg', 'jpeg', 'png', 'tif', 'tiff'))
    ON CONFLICT (stat_date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        active_users = EXCLUDED.active_users,
        new_users = EXCLUDED.new_users,
        total_images = EXCLUDED.total_images,
        new_images = EXCLUDED.new_images,
        total_views = EXCLUDED.total_views,
        total_uploads = EXCLUDED.total_uploads,
        total_downloads = EXCLUDED.total_downloads,
        storage_used = EXCLUDED.storage_used,
        dicom_count = EXCLUDED.dicom_count,
        aan_count = EXCLUDED.aan_count,
        jpeg_count = EXCLUDED.jpeg_count,
        png_count = EXCLUDED.png_count,
        tiff_count = EXCLUDED.tiff_count,
        other_count = EXCLUDED.other_count,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Initialize today's stats
SELECT update_system_stats(CURRENT_DATE);

COMMENT ON TABLE image_views IS 'Tracks when users view images';
COMMENT ON TABLE user_activity IS 'Tracks all user actions for analytics';
COMMENT ON TABLE system_stats IS 'Daily aggregated system statistics';
COMMENT ON TABLE job_queue IS 'Tracks background job processing status';
