# System Architecture - Performance & Analytics

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Dashboard  │  │    Admin     │  │   Analytics          │  │
│  │     Page     │  │   Dashboard  │  │   Dashboard          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                    │                │
│         └──────────────────┴────────────────────┘                │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │   API Service   │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼──────────────────────────────────┘
                             │ HTTP/REST
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                    BACKEND (Express/Node.js)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                      API Routes                           │ │
│  │  /auth  /images  /upload  /admin  /analytics            │ │
│  └────┬─────────┬──────────┬─────────┬──────────┬──────────┘ │
│       │         │          │         │          │             │
│  ┌────▼─────────▼──────────▼─────────▼──────────▼──────────┐ │
│  │                    Middleware                             │ │
│  │  • Authentication  • Activity Tracking  • Validation     │ │
│  └────┬─────────┬──────────┬─────────┬──────────┬──────────┘ │
│       │         │          │         │          │             │
│  ┌────▼─────────▼──────────▼─────────▼──────────▼──────────┐ │
│  │                      Services                             │ │
│  │  • Auth  • Image  • Upload  • Admin  • Analytics        │ │
│  │  • Queue  • Storage  • DICOM Converter                  │ │
│  └────┬─────────┬──────────┬─────────┬──────────┬──────────┘ │
│       │         │          │         │          │             │
│  ┌────▼─────────▼──────────▼─────────▼──────────▼──────────┐ │
│  │                    Repositories                           │ │
│  │  • User  • Image  • Analytics  • Metadata               │ │
│  └────┬─────────┬──────────┬─────────┬──────────┬──────────┘ │
│       │         │          │         │          │             │
└───────┼─────────┼──────────┼─────────┼──────────┼────────────┘
        │         │          │         │          │
        │         │          │         │          │
┌───────▼─────────▼──────────▼─────────▼──────────▼────────────┐
│                    PostgreSQL Database                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  users   │  │  images  │  │  image_  │  │    user_     │ │
│  │          │  │          │  │  views   │  │   activity   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ system_  │  │   job_   │  │  upload_ │  │   metadata   │ │
│  │  stats   │  │  queue   │  │ sessions │  │              │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Job Queue Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Upload Flow                              │
└─────────────────────────────────────────────────────────────────┘

User Upload
    │
    ▼
┌─────────────────┐
│  Upload API     │  ← Returns immediately (200ms)
│  /api/upload    │
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│  Save to DB     │                  │  Save to Disk   │
│  (metadata)     │                  │  (file)         │
└────────┬────────┘                  └────────┬────────┘
         │                                     │
         └──────────────┬──────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Queue Service   │
              │  (BullMQ)        │
              └────────┬─────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│  DICOM Queue     │        │ Thumbnail Queue  │
│  Priority: 0     │        │  Priority: 0     │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│  Redis           │        │  Redis           │
│  bull:dicom-*    │        │  bull:thumb-*    │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│  DICOM Worker    │        │ Thumbnail Worker │
│  (3 concurrent)  │        │  (5 concurrent)  │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         ├─ Convert DICOM to PNG     ├─ Generate thumbnail
         ├─ Update progress          ├─ Resize image
         ├─ Retry on failure (3x)    ├─ Save to disk
         └─ Update DB                └─ Update DB
```

## Analytics Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Actions                                │
└─────────────────────────────────────────────────────────────────┘

Login  Upload  View  Download  Delete
  │      │      │       │        │
  └──────┴──────┴───────┴────────┘
         │
         ▼
┌─────────────────────┐
│ Activity Tracker    │  ← Middleware
│ (Middleware)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Analytics Service   │
└──────────┬──────────┘
           │
           ├────────────────────────────────┐
           │                                │
           ▼                                ▼
┌─────────────────────┐        ┌─────────────────────┐
│  user_activity      │        │   image_views       │
│  • activity_type    │        │   • image_id        │
│  • resource_type    │        │   • user_id         │
│  • resource_id      │        │   • viewed_at       │
│  • metadata         │        │   • duration        │
│  • ip_address       │        └─────────────────────┘
│  • user_agent       │
└─────────────────────┘
           │
           │ Daily Aggregation (Midnight)
           │
           ▼
┌─────────────────────┐
│   system_stats      │
│   • stat_date       │
│   • total_users     │
│   • active_users    │
│   • total_images    │
│   • new_images      │
│   • total_views     │
│   • storage_used    │
│   • file_type_*     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Analytics Dashboard │  ← Frontend
│  • Charts           │
│  • Tables           │
│  • Metrics          │
└─────────────────────┘
```

## Pagination Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Cursor-Based Pagination                        │
└─────────────────────────────────────────────────────────────────┘

Traditional Offset Pagination (Slow for large datasets):
┌──────────────────────────────────────────────────────────────┐
│  SELECT * FROM images                                         │
│  WHERE user_id = 1                                            │
│  ORDER BY created_at DESC                                     │
│  LIMIT 20 OFFSET 1000  ← Scans 1020 rows!                   │
└──────────────────────────────────────────────────────────────┘

Cursor-Based Pagination (Fast, consistent):
┌──────────────────────────────────────────────────────────────┐
│  SELECT * FROM images                                         │
│  WHERE user_id = 1                                            │
│    AND (created_at < '2024-01-15' OR                         │
│         (created_at = '2024-01-15' AND id < 123))            │
│  ORDER BY created_at DESC, id DESC                            │
│  LIMIT 21  ← Always scans 21 rows!                          │
└──────────────────────────────────────────────────────────────┘

Flow:
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /images?useCursor=true&limit=20
       ▼
┌─────────────┐
│  API Route  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  ImageRepository    │
│  findByUserIdWith   │
│  Cursor()           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     Uses Index:
│   PostgreSQL        │     idx_images_user_created
│   (with index)      │     (user_id, created_at DESC)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Response          │
│   {                 │
│     data: [...],    │
│     nextCursor,     │
│     prevCursor,     │
│     hasMore         │
│   }                 │
└─────────────────────┘
```

## Database Indexes

```
┌─────────────────────────────────────────────────────────────────┐
│                      Index Strategy                              │
└─────────────────────────────────────────────────────────────────┘

images table:
┌──────────────────────────────────────────────────────────────┐
│  idx_images_user_id          → WHERE user_id = ?             │
│  idx_images_created_at       → ORDER BY created_at           │
│  idx_images_file_type        → WHERE file_type = ?           │
│  idx_images_user_created     → WHERE user_id = ?             │
│                                 ORDER BY created_at           │
└──────────────────────────────────────────────────────────────┘

users table:
┌──────────────────────────────────────────────────────────────┐
│  idx_users_status            → WHERE status = ?              │
│  idx_users_role              → WHERE role = ?                │
│  idx_users_email             → WHERE email = ?               │
│  idx_users_created_at        → ORDER BY created_at           │
└──────────────────────────────────────────────────────────────┘

Analytics tables:
┌──────────────────────────────────────────────────────────────┐
│  idx_image_views_image_id    → GROUP BY image_id            │
│  idx_image_views_user_id     → WHERE user_id = ?            │
│  idx_user_activity_user_id   → WHERE user_id = ?            │
│  idx_user_activity_type      → WHERE activity_type = ?      │
│  idx_user_activity_created   → ORDER BY created_at          │
└──────────────────────────────────────────────────────────────┘

Query Performance:
Before indexes:  Seq Scan → 2500ms
After indexes:   Index Scan → 150ms (94% faster!)
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    Component Layers                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Presentation Layer (React Components)                           │
│  • AnalyticsDashboardPage                                       │
│  • AdminDashboardPage                                           │
│  • DashboardPage                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Service Layer (Frontend)                                        │
│  • analyticsService                                             │
│  • authService                                                  │
│  • adminService                                                 │
│  • api (axios)                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────────┐
│  API Layer (Express Routes)                                      │
│  • /api/analytics/*                                             │
│  • /api/images/*                                                │
│  • /api/admin/*                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Middleware Layer                                                │
│  • authenticateToken                                            │
│  • requireAdmin                                                 │
│  • trackActivity                                                │
│  • trackImageView                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Business Logic Layer (Services)                                 │
│  • AnalyticsService                                             │
│  • QueueService                                                 │
│  • ImageProcessingService                                       │
│  • DicomConverterService                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Data Access Layer (Repositories)                                │
│  • AnalyticsRepository                                          │
│  • ImageRepository                                              │
│  • UserRepository                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Data Layer (PostgreSQL + Redis)                                 │
│  • PostgreSQL (persistent data)                                 │
│  • Redis (job queue, caching)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Deployment                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   Load Balancer │
│   (Nginx)       │
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│  Frontend       │              │  Backend API    │
│  (Static)       │              │  (Node.js)      │
│  Port 80/443    │              │  Port 3000      │
└─────────────────┘              └────────┬────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
         ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
         │  Worker 1       │   │  Worker 2       │   │  Worker 3       │
         │  (DICOM)        │   │  (DICOM)        │   │  (Thumbnail)    │
         └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
                  │                     │                     │
                  └─────────────────────┼─────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
         ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
         │  PostgreSQL     │ │  Redis          │ │  File Storage   │
         │  (Primary)      │ │  (Queue)        │ │  (S3/Local)     │
         └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Key Design Patterns

1. **Repository Pattern**: Data access abstraction
2. **Service Layer**: Business logic separation
3. **Middleware Pattern**: Cross-cutting concerns
4. **Job Queue Pattern**: Async processing
5. **Cursor Pagination**: Efficient data retrieval
6. **Observer Pattern**: Activity tracking

## Technology Stack

```
Frontend:
├── React 18
├── TypeScript
├── Vite
├── Chart.js
├── Tailwind CSS
└── Axios

Backend:
├── Node.js
├── Express
├── TypeScript
├── BullMQ
└── Sharp

Data:
├── PostgreSQL 14+
├── Redis 6+
└── File System

DevOps:
├── Docker (optional)
├── PM2 (process manager)
└── Nginx (reverse proxy)
```

This architecture provides:
- ✅ Scalability
- ✅ Performance
- ✅ Maintainability
- ✅ Observability
- ✅ Reliability
