#!/bin/bash

# Quick GitHub Push Script
# This script helps you push the mammogram viewer to GitHub

echo "🚀 Mammogram Viewer - GitHub Push Helper"
echo "========================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
    echo ""
fi

# Check if .gitignore exists
if [ ! -f .gitignore ]; then
    echo "❌ Error: .gitignore not found!"
    echo "Please create .gitignore first"
    exit 1
fi

# Check if .env is properly ignored
if git check-ignore backend/.env > /dev/null 2>&1; then
    echo "✅ .env file is properly ignored"
else
    echo "⚠️  Warning: .env file might not be ignored!"
    echo "Please check your .gitignore file"
    read -p "Continue anyway? (y/N): " continue
    if [ "$continue" != "y" ] && [ "$continue" != "Y" ]; then
        exit 1
    fi
fi

echo ""
echo "📋 Current Git Status:"
echo "---------------------"
git status --short
echo ""

# Ask for repository URL
read -p "Enter your GitHub repository URL (e.g., git@github.com:username/mammogram-viewer.git): " repo_url

if [ -z "$repo_url" ]; then
    echo "❌ Error: Repository URL is required"
    exit 1
fi

# Check if remote already exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Remote 'origin' already exists"
    read -p "Do you want to update it? (y/N): " update_remote
    if [ "$update_remote" = "y" ] || [ "$update_remote" = "Y" ]; then
        git remote set-url origin "$repo_url"
        echo "✅ Remote updated"
    fi
else
    git remote add origin "$repo_url"
    echo "✅ Remote added"
fi

echo ""
echo "🔍 Files to be committed:"
echo "------------------------"
git status --short
echo ""

read -p "Do you want to stage all files? (y/N): " stage_all

if [ "$stage_all" = "y" ] || [ "$stage_all" = "Y" ]; then
    git add .
    echo "✅ All files staged"
else
    echo "Please stage files manually with: git add <files>"
    exit 0
fi

echo ""
read -p "Enter commit message (or press Enter for default): " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="Initial commit: Mammogram Viewer Application

- Professional medical imaging application
- High-tech medical UI with dark theme
- DICOM and AAN format support
- User authentication with admin approval
- Image upload and processing
- Analytics dashboard
- Complete deployment documentation"
fi

git commit -m "$commit_msg"
echo "✅ Changes committed"

echo ""
read -p "Push to GitHub now? (y/N): " push_now

if [ "$push_now" = "y" ] || [ "$push_now" = "Y" ]; then
    # Detect default branch name
    default_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
    
    echo "📤 Pushing to $default_branch..."
    git push -u origin "$default_branch"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Successfully pushed to GitHub!"
        echo ""
        echo "Your repository is now available at:"
        echo "$repo_url"
        echo ""
        echo "Next steps:"
        echo "1. Visit your repository on GitHub"
        echo "2. Add a description and topics"
        echo "3. Review the README.md"
        echo "4. Share with your team!"
    else
        echo ""
        echo "❌ Push failed. Please check the error above."
        echo ""
        echo "Common issues:"
        echo "- Authentication: Make sure you have SSH key or token configured"
        echo "- Repository: Verify the repository exists and you have access"
        echo "- Branch: Check if you're pushing to the correct branch"
    fi
else
    echo ""
    echo "📝 To push manually later, run:"
    echo "   git push -u origin main"
fi

echo ""
echo "✅ Done!"
