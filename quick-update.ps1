# Quick Update Script for GetCash Repository (PowerShell)

# After making changes in VS Code, run these commands to update GitHub:

Write-Host "🔄 Updating GetCash repository..." -ForegroundColor Cyan

# 1. Add all changed files  
git add .
Write-Host "✅ Files staged for commit" -ForegroundColor Green

# 2. Commit with a message
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update: Made changes in VS Code - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}
git commit -m $commitMessage
Write-Host "✅ Changes committed" -ForegroundColor Green

# 3. Push to GitHub
git push origin main
Write-Host "✅ Changes pushed to GitHub!" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 Your repository: https://github.com/buttuura/GetCash" -ForegroundColor Yellow
Write-Host "🚀 If deployed on Render, updates will be automatic!" -ForegroundColor Yellow