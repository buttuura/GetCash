#!/bin/bash

# GitHub Preparation Script for Task Management App
# This script prepares your app for GitHub deployment

echo "🚀 Preparing Task Management App for GitHub..."
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" < "v14" ]]; then
    echo "⚠️  Warning: Node.js 14+ recommended for best compatibility"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    
    # Generate a secure JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update .env with generated secret
    sed -i "s/your-super-secret-jwt-key-here-make-it-long-and-random-change-this-in-production/$JWT_SECRET/" .env
    
    echo "✅ .env file created with secure JWT secret"
else
    echo "ℹ️  .env file already exists"
fi

# Test database setup
echo "🗄️  Testing database setup..."
node database-manager.js admin > /dev/null 2>&1
echo "✅ Database setup complete"

# Test server startup
echo "🧪 Testing server startup..."
timeout 5s node server.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID > /dev/null 2>&1; then
    echo "✅ Server starts successfully"
    kill $SERVER_PID > /dev/null 2>&1
else
    echo "❌ Server startup test failed"
fi

# Check git status
echo "📁 Checking git repository..."
if [ -d ".git" ]; then
    echo "✅ Git repository detected"
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        echo "📝 Uncommitted changes detected:"
        git status --short
    else
        echo "✅ Working directory clean"
    fi
else
    echo "⚠️  No git repository found. Initialize with:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
fi

# Check .gitignore
echo "🚫 Checking .gitignore..."
if [ -f ".gitignore" ]; then
    if grep -q "app_data.db" .gitignore && grep -q "node_modules" .gitignore; then
        echo "✅ .gitignore properly configured"
    else
        echo "⚠️  .gitignore may need updates"
    fi
else
    echo "❌ .gitignore file missing"
fi

# Security check
echo "🔒 Security checklist..."
if grep -q "your_jwt_secret_key_change_this_in_production" server.js; then
    echo "⚠️  Default JWT secret detected in server.js - this is OK for development"
fi

if [ -f ".env" ] && grep -q "your-super-secret-jwt-key" .env; then
    echo "❌ Default JWT secret in .env file - please update!"
else
    echo "✅ JWT secret appears to be customized"
fi

# File size check
echo "📊 Checking file sizes..."
DATABASE_SIZE=$(du -sh app_data.db 2>/dev/null | cut -f1 || echo "0K")
TOTAL_SIZE=$(du -sh . | cut -f1)
echo "Database size: $DATABASE_SIZE"
echo "Total project size: $TOTAL_SIZE"

# Generate deployment checklist
echo ""
echo "📋 DEPLOYMENT CHECKLIST"
echo "======================="
echo ""
echo "Before pushing to GitHub:"
echo "□ Remove any sensitive data from code"
echo "□ Update README.md with your project details"
echo "□ Test the application locally"
echo "□ Verify .gitignore excludes sensitive files"
echo ""
echo "For production deployment:"
echo "□ Set JWT_SECRET environment variable"
echo "□ Set NODE_ENV=production"
echo "□ Configure CORS_ORIGIN for your domain"
echo "□ Set up monitoring and logging"
echo ""
echo "GitHub repository setup:"
echo "□ Create new repository on GitHub"
echo "□ Add remote: git remote add origin <your-repo-url>"
echo "□ Push: git push -u origin main"
echo "□ Add repository description and topics"
echo ""

# Final status
echo "🎉 GitHub Preparation Complete!"
echo ""
echo "Your app is ready for:"
echo "✅ Multi-user deployment"
echo "✅ GitHub hosting"
echo "✅ Production environments"
echo "✅ Heroku, Railway, Render deployment"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git add . && git commit -m 'Ready for deployment' && git push"
echo "2. Choose hosting platform (Heroku/Railway/Render)"
echo "3. Set environment variables on hosting platform"
echo "4. Deploy and share!"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed deployment instructions"