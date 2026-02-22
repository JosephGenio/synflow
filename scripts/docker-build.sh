#!/bin/bash
set -e

echo "🔨 Building Synflow Docker images..."

# Build development image
echo "📦 Building development image..."
docker build -t synflow-backend:dev --target development .

# Build production image
echo "📦 Building production image..."
docker build -t synflow-backend:latest --target production .

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Images created:"
docker images | grep synflow || echo "No synflow images found"

echo ""
echo "💡 To test the production image:"
echo "   docker run --rm -it synflow-backend:latest"
