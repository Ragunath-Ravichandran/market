#!/bin/bash
# Market Intelligence Suite - Setup Script
# Run this script to set up the project for local development

set -e

echo "🚀 Market Intelligence Suite - Setup Script"
echo "==========================================="
echo ""

# Check for required tools
echo "📋 Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+"
    exit 1
fi

echo "✅ Python $(python3 --version)"
echo "✅ Node $(node --version)"
echo ""

# Setup Backend
echo "🔧 Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
fi

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Backend setup complete"
echo ""

# Setup Frontend
echo "🎨 Setting up Frontend..."
cd ../frontend

echo "Installing Node dependencies..."
npm install

echo "✅ Frontend setup complete"
echo ""

# Setup environment file
echo "🔐 Setting up environment variables..."
cd ..

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created .env file from .env.example"
    echo "⚠️  Please edit .env and add your API keys:"
    echo "   - GROQ_API_KEY"
    echo "   - GOOGLE_API_KEY"
    echo "   - TAVILY_API_KEY"
else
    echo "✅ .env already exists"
fi

echo ""
echo "==========================================="
echo "✨ Setup complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Run the backend:    cd backend && python -m uvicorn main:app --reload"
echo "3. Run the frontend:   cd frontend && npm run dev"
echo "4. Visit:              http://localhost:5173"
echo ""
echo "For more info, see README.md and DEPLOYMENT.md"
