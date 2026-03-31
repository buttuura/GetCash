# GitHub Preparation Script for Task Management App (PowerShell)
# This script prepares your app for GitHub deployment

Write-Host "🚀 Preparing Task Management App for GitHub..." -ForegroundColor Cyan
Write-Host "=============================================="

# Check if we're in the right directory
if (-not (Test-Path "server.js")) {
    Write-Host "❌ Error: Please run this script from the backend directory" -ForegroundColor Red
    exit 1
}

# Check Node.js version
Write-Host "📋 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    
    # Generate a secure JWT secret
    $jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    
    # Update .env with generated secret
    (Get-Content ".env") -replace "your-super-secret-jwt-key-here-make-it-long-and-random-change-this-in-production", $jwtSecret | Set-Content ".env"
    
    Write-Host "✅ .env file created with secure JWT secret" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Blue
}

# Test database setup
Write-Host "🗄️  Testing database setup..." -ForegroundColor Yellow
node database-manager.js admin | Out-Null
Write-Host "✅ Database setup complete" -ForegroundColor Green

# Check git status
Write-Host "📁 Checking git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✅ Git repository detected" -ForegroundColor Green
    
    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "📝 Uncommitted changes detected:"
        git status --short
    } else {
        Write-Host "✅ Working directory clean" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No git repository found. Initialize with:" -ForegroundColor Yellow
    Write-Host "   git init"
    Write-Host "   git add ."
    Write-Host "   git commit -m 'Initial commit'"
}

# Check .gitignore
Write-Host "🚫 Checking .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "app_data\.db" -and $gitignoreContent -match "node_modules") {
        Write-Host "✅ .gitignore properly configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .gitignore may need updates" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .gitignore file missing" -ForegroundColor Red
}

# Security check
Write-Host "🔒 Security checklist..." -ForegroundColor Yellow
$serverContent = Get-Content "server.js" -Raw
if ($serverContent -match "your_jwt_secret_key_change_this_in_production") {
    Write-Host "⚠️  Default JWT secret detected in server.js - this is OK for development" -ForegroundColor Yellow
}

if ((Test-Path ".env")) {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "your-super-secret-jwt-key") {
        Write-Host "❌ Default JWT secret in .env file - please update!" -ForegroundColor Red
    } else {
        Write-Host "✅ JWT secret appears to be customized" -ForegroundColor Green
    }
}

# File size check
Write-Host "📊 Checking file sizes..." -ForegroundColor Yellow
if (Test-Path "app_data.db") {
    $dbSize = [math]::Round((Get-Item "app_data.db").Length / 1KB, 2)
    Write-Host "Database size: $dbSize KB"
} else {
    Write-Host "Database size: 0 KB (will be created on first run)"
}

# Generate deployment checklist
Write-Host ""
Write-Host "📋 DEPLOYMENT CHECKLIST" -ForegroundColor Cyan
Write-Host "======================="
Write-Host ""
Write-Host "Before pushing to GitHub:" -ForegroundColor White
Write-Host "□ Remove any sensitive data from code"
Write-Host "□ Update README.md with your project details"
Write-Host "□ Test the application locally"
Write-Host "□ Verify .gitignore excludes sensitive files"
Write-Host ""
Write-Host "For production deployment:" -ForegroundColor White
Write-Host "□ Set JWT_SECRET environment variable"
Write-Host "□ Set NODE_ENV=production"
Write-Host "□ Configure CORS_ORIGIN for your domain"
Write-Host "□ Set up monitoring and logging"
Write-Host ""
Write-Host "GitHub repository setup:" -ForegroundColor White
Write-Host "□ Create new repository on GitHub"
Write-Host "□ Add remote: git remote add origin <your-repo-url>"
Write-Host "□ Push: git push -u origin main"
Write-Host "□ Add repository description and topics"
Write-Host ""

# Final status
Write-Host "🎉 GitHub Preparation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is ready for:" -ForegroundColor Cyan
Write-Host "✅ Multi-user deployment" -ForegroundColor Green
Write-Host "✅ GitHub hosting" -ForegroundColor Green
Write-Host "✅ Production environments" -ForegroundColor Green
Write-Host "✅ Heroku, Railway, Render deployment" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Push to GitHub: git add . && git commit -m 'Ready for deployment' && git push"
Write-Host "2. Choose hosting platform (Heroku/Railway/Render)"
Write-Host "3. Set environment variables on hosting platform"
Write-Host "4. Deploy and share!"
Write-Host ""
Write-Host "📖 See DEPLOYMENT_GUIDE.md for detailed deployment instructions" -ForegroundColor Blue