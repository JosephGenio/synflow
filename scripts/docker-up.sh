#!/bin/bash
set -e

echo "🚀 Starting Synflow development environment..."

# Check if env/.env.development exists
if [ ! -f env/.env.development ]; then
    echo "❌ Error: env/.env.development not found"
    echo "📋 Copy env/.env.example to env/.env.development and configure it"
    exit 1
fi

# Start services
echo "📦 Starting Docker containers..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 5

# Wait for MSSQL to be healthy
echo "⏳ Waiting for MSSQL to be ready..."
docker-compose exec -T mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$(grep DB_PASSWORD env/.env.development | cut -d= -f2)" -Q "SELECT 1" -C -b 2>/dev/null || echo "⏳ Still waiting for MSSQL..."

echo ""
echo "✅ Development environment started!"
echo ""
echo "📍 Service URLs:"
echo "   Backend API: http://localhost:3001"
echo "   MSSQL Database: localhost:1433"
echo ""
echo "📝 Next steps:"
echo "   1. Run 'pnpm dev:app' in another terminal to start the frontend"
echo "   2. Open http://localhost:3000 in your browser"
echo ""
echo "🛑 To stop the environment, run: pnpm docker:down"
