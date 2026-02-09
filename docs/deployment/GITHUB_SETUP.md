# GitHub Setup Guide

## Prerequisites

- Git installed on your system
- GitHub account created
- SSH key or personal access token configured

## Step 1: Initialize Git Repository (if not already done)

```bash
# Check if git is initialized
git status

# If not initialized, run:
git init
```

## Step 2: Create .gitignore

A `.gitignore` file has been created to exclude:
- `node_modules/`
- `.env` files
- Build outputs (`dist/`, `build/`)
- Uploads and generated files
- IDE files
- Logs

**⚠️ Important**: Make sure `.env` files are NOT committed!

## Step 3: Create GitHub Repository

### Option A: Via GitHub Website
1. Go to https://github.com/new
2. Repository name: `mammogram-viewer` (or your choice)
3. Description: "Professional medical imaging application for mammogram viewing"
4. Choose: **Private** (recommended for medical applications)
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### Option B: Via GitHub CLI
```bash
gh repo create mammogram-viewer --private --source=. --remote=origin
```

## Step 4: Add Remote Repository

Copy the repository URL from GitHub, then:

```bash
# For HTTPS
git remote add origin https://github.com/YOUR_USERNAME/mammogram-viewer.git

# For SSH (recommended)
git remote add origin git@github.com:YOUR_USERNAME/mammogram-viewer.git

# Verify remote
git remote -v
```

## Step 5: Prepare for First Commit

### Check what will be committed
```bash
git status
```

### Review sensitive files
Make sure these are NOT staged:
- `backend/.env`
- `uploads/`
- `node_modules/`
- Any production secrets

### Create example .env file
```bash
# Create example env file (without secrets)
cp backend/.env backend/.env.example

# Edit .env.example to remove actual values
nano backend/.env.example
```

Example `.env.example`:
```env
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mammogram_viewer
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Storage
UPLOAD_DIR=./uploads
THUMBNAIL_DIR=./thumbnails
DICOM_DIR=./dicom

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Step 6: Stage Files

```bash
# Add all files (respecting .gitignore)
git add .

# Or add specific directories
git add backend/
git add frontend/
git add nginx/
git add *.md
git add docker-compose.yml
git add .gitignore
```

## Step 7: Create First Commit

```bash
git commit -m "Initial commit: Mammogram Viewer Application

- Professional medical imaging application
- High-tech medical UI with dark theme
- DICOM and AAN format support
- User authentication with admin approval
- Image upload and processing
- Analytics dashboard
- Complete deployment documentation"
```

## Step 8: Push to GitHub

```bash
# Push to main branch
git push -u origin main

# Or if using master branch
git push -u origin master
```

## Step 9: Verify on GitHub

1. Go to your repository on GitHub
2. Check that files are uploaded
3. Verify README.md displays correctly
4. Confirm `.env` is NOT visible

## Step 10: Add Repository Description

On GitHub repository page:
1. Click "About" settings (gear icon)
2. Add description: "Professional medical imaging application for mammogram viewing with DICOM support"
3. Add topics: `medical-imaging`, `dicom`, `mammogram`, `healthcare`, `react`, `nodejs`, `typescript`
4. Save changes

## Security Checklist

Before pushing, verify:

- [ ] `.env` file is in `.gitignore`
- [ ] No database passwords in code
- [ ] No API keys or secrets committed
- [ ] `.env.example` has placeholder values only
- [ ] `uploads/` directory is ignored
- [ ] `node_modules/` is ignored
- [ ] Production secrets are not included

## Optional: Add GitHub Actions

Create `.github/workflows/ci.yml` for automated testing:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install backend dependencies
      run: cd backend && npm ci
    
    - name: Run backend tests
      run: cd backend && npm test
    
    - name: Install frontend dependencies
      run: cd frontend && npm ci
    
    - name: Build frontend
      run: cd frontend && npm run build
```

## Branching Strategy

### Recommended branches:
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Urgent fixes

```bash
# Create develop branch
git checkout -b develop
git push -u origin develop

# Create feature branch
git checkout -b feature/new-feature
```

## Collaboration

### Add collaborators:
1. Go to repository Settings
2. Click "Collaborators"
3. Add team members

### Protect main branch:
1. Go to Settings → Branches
2. Add rule for `main`
3. Enable:
   - Require pull request reviews
   - Require status checks
   - Include administrators

## Common Git Commands

```bash
# Check status
git status

# View changes
git diff

# Add files
git add <file>

# Commit changes
git commit -m "message"

# Push changes
git push

# Pull latest changes
git pull

# Create branch
git checkout -b branch-name

# Switch branch
git checkout branch-name

# Merge branch
git merge branch-name

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- <file>
```

## Troubleshooting

### Large files error
If you get "file too large" error:

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.dcm"
git lfs track "*.dicom"

# Add .gitattributes
git add .gitattributes
git commit -m "Add Git LFS tracking"
```

### Authentication failed
```bash
# For HTTPS, use personal access token
# Generate at: https://github.com/settings/tokens

# For SSH, add SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add to: https://github.com/settings/keys
```

### Push rejected
```bash
# Pull latest changes first
git pull origin main --rebase

# Then push
git push origin main
```

## Repository Structure on GitHub

```
mammogram-viewer/
├── .github/              # GitHub Actions workflows
├── backend/              # Backend code
├── frontend/             # Frontend code
├── nginx/                # Nginx configurations
├── .kiro/                # Kiro specs (optional)
├── .gitignore
├── README.md
├── DEPLOYMENT_GUIDE.md
├── docker-compose.yml
└── ... (other docs)
```

## Next Steps After Pushing

1. **Add README badges** (optional)
   - Build status
   - License
   - Version

2. **Create releases**
   ```bash
   git tag -a v1.0.0 -m "Initial release"
   git push origin v1.0.0
   ```

3. **Add LICENSE file**
   - Choose appropriate license
   - Add LICENSE file to repository

4. **Update documentation**
   - Add screenshots
   - Create wiki pages
   - Add contribution guidelines

5. **Setup GitHub Pages** (optional)
   - For documentation hosting

## Example: Complete First Push

```bash
# 1. Initialize (if needed)
git init

# 2. Add remote
git remote add origin git@github.com:YOUR_USERNAME/mammogram-viewer.git

# 3. Check .gitignore is working
git status

# 4. Stage all files
git add .

# 5. Commit
git commit -m "Initial commit: Mammogram Viewer Application"

# 6. Push
git push -u origin main
```

## Success!

Your repository is now on GitHub! 🎉

**Repository URL**: `https://github.com/YOUR_USERNAME/mammogram-viewer`

### Share with team:
```bash
# Clone command for team members
git clone git@github.com:YOUR_USERNAME/mammogram-viewer.git
cd mammogram-viewer
```

---

**For deployment, see `DEPLOYMENT_GUIDE.md`**
