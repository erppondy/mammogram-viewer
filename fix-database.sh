#!/bin/bash

# Fix Database Connection Script
echo "🔧 Fixing Database Connection..."
echo ""

# Check if PostgreSQL is running
echo "1. Checking PostgreSQL status..."
if sudo systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL is not running. Starting it..."
    sudo systemctl start postgresql
fi

echo ""
echo "2. Setting PostgreSQL password..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null

echo ""
echo "3. Creating database..."
sudo -u postgres psql -c "CREATE DATABASE mammogram_viewer;" 2>/dev/null || echo "Database may already exist"

echo ""
echo "4. Updating .env file..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
fi

# Update password in .env
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=postgres/' backend/.env

echo ""
echo "5. Setting up database tables..."
npm run db:setup

echo ""
echo "✅ Done! Now restart your server:"
echo ""
echo "   npm run dev"
echo ""
echo "Then test with:"
echo "   curl http://localhost:3000/health"
echo ""
