#!/bin/bash

# HeyJarvis Setup Script
echo "🤖 Setting up HeyJarvis Autonomous Orchestration System..."

# Check Node.js version
echo "📋 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for environment file
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file template..."
    cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/heyjarvis

# AI Service Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Environment
NODE_ENV=development

# Optional: LinkedIn Scraping (for production)
# LINKEDIN_EMAIL=your_linkedin_email
# LINKEDIN_PASSWORD=your_linkedin_password
EOL
    echo "📝 Created .env file. Please update with your actual values."
else
    echo "✅ .env file already exists"
fi

# Check if DATABASE_URL is set
if grep -q "your_" .env; then
    echo "⚠️  Please update your .env file with actual values before continuing"
    echo "   Required: DATABASE_URL and ANTHROPIC_API_KEY"
fi

# Database setup
echo "🗃️  Setting up database..."
if grep -q "postgresql://" .env && ! grep -q "your_" .env; then
    echo "📊 Pushing database schema..."
    npm run db:push
    echo "✅ Database schema updated"
else
    echo "⚠️  Skipping database setup - please configure DATABASE_URL first"
fi

# Build check
echo "🔨 Testing build process..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "⚠️  Build failed - please check dependencies"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env with your actual DATABASE_URL and ANTHROPIC_API_KEY"
echo "   2. Run 'npm run db:push' to setup the database"
echo "   3. Run 'npm run dev' to start development server"
echo ""
echo "🌐 The application will be available at http://localhost:5000"
echo "🤖 Agent interfaces:"
echo "   • Sales Agent: http://localhost:5000/sales-agent"
echo "   • Marketing Agent: http://localhost:5000/marketing-agent" 
echo "   • Engineering Agent: http://localhost:5000/engineering-agent"
echo ""
echo "📚 Check README.md for detailed documentation"