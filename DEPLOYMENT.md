# Deployment Guide 🚀

Complete guide to deploy the Market Intelligence Suite to production.

## Table of Contents

1. [GitHub Pages (Frontend)](#github-pages-frontend)
2. [Render.com (Backend)](#rendercom-backend)
3. [Docker Deployment](#docker-deployment)
4. [Alternative Platforms](#alternative-platforms)
5. [Environment Setup](#environment-setup)
6. [CI/CD Pipeline](#cicd-pipeline)

---

## GitHub Pages (Frontend)

### Automatic Deployment

The frontend automatically deploys to GitHub Pages when you push to `main` or `master` branch.

**What happens:**
- GitHub Actions builds your React app
- Generates static files in `dist/`
- Deploys to `https://yourusername.github.io/market/`

### Enable GitHub Pages

1. Go to **Repository Settings** → **Pages**
2. Under "Build and deployment"
   - Source: **GitHub Actions**
3. That's it! Your site will deploy automatically

### Manual Deployment

```bash
cd frontend
npm run build
# The contents of dist/ are ready for deployment
```

### Troubleshooting

**Issue**: Styles not loading on GitHub Pages
- **Solution**: Update `vite.config.js` with:
  ```javascript
  export default {
    base: '/market/',  // Your repo name
  }
  ```

**Issue**: 404 on refresh
- **Solution**: GitHub Pages doesn't support client-side routing
- Add a `404.html` file in `frontend/public/`:
  ```html
  <script>
    const location = window.location;
    if (location.hostname !== 'localhost') {
      location.href = '/market/#' + location.pathname;
    }
  </script>
  ```

---

## Render.com (Backend)

### Step 1: Connect Repository

1. Go to https://render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select `market-intel-groq` repository

### Step 2: Configure Web Service

**Settings:**
- **Name**: `market-intelligence-api`
- **Runtime**: `Python 3.11`
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`

### Step 3: Set Environment Variables

In Render dashboard, go to **Environment**:

```
GROQ_API_KEY=your_key
GOOGLE_API_KEY=your_key
TAVILY_API_KEY=your_key
ENVIRONMENT=production
```

### Step 4: Deploy

Click **Create Web Service** and Render will automatically deploy!

**Your backend URL will be**: `https://your-service-name.onrender.com`

### Update Frontend

Update `frontend/src/hooks/useMarketResearch.js`:

```javascript
const API_BASE_URL = process.env.VITE_API_URL || 
  'https://your-service-name.onrender.com';
```

---

## Docker Deployment

### Local Development with Docker

```bash
# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up --build

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Deploy Docker to Production

**Option 1: Render.com (with Docker)**

1. Create `render.yaml` with:
```yaml
services:
  - type: web
    image: your-docker-image
    envVars:
      - key: GROQ_API_KEY
        sync: false
```

**Option 2: Railway.app**

```bash
npm i -g @railway/cli
railway init
railway up
```

**Option 3: AWS ECS**

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker build -t market-intel .
docker tag market-intel:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/market-intel:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/market-intel:latest
```

---

## Alternative Platforms

### Heroku

```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add API keys
heroku config:set GROQ_API_KEY=your_key
heroku config:set GOOGLE_API_KEY=your_key
heroku config:set TAVILY_API_KEY=your_key

# Deploy
git push heroku main
```

### Railway.app

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link project
railway login
railway init

# Add environment variables
railway variables

# Deploy
railway up
```

### Vercel (Python Functions)

1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:
```json
{
  "functions": {
    "backend/main.py": {
      "memory": 3008,
      "maxDuration": 30
    }
  }
}
```
3. Deploy: `vercel`

### DigitalOcean App Platform

1. Go to **DigitalOcean** → **App Platform** → **Create App**
2. Connect GitHub repository
3. Configure:
   - **Component**: Web Service
   - **Source**: `backend/main.py`
   - **HTTP Port**: 8000
4. Add environment variables
5. Deploy!

---

## Environment Setup

### Production Environment Variables

Create these in your deployment platform:

```env
# API Keys (Required)
GROQ_API_KEY=your_production_key
GOOGLE_API_KEY=your_production_key
TAVILY_API_KEY=your_production_key

# Configuration
DEBUG=False
ENVIRONMENT=production
LOG_LEVEL=INFO

# CORS
ALLOWED_ORIGINS=https://yourusername.github.io,https://yourdomain.com

# Database (Optional)
CHROMA_DB_PATH=/tmp/chroma_data
```

### Secrets Management

**GitHub Secrets** (for CI/CD):

1. Go to **Repository Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `GROQ_API_KEY`
   - `GOOGLE_API_KEY`
   - `TAVILY_API_KEY`

**Usage in workflows**:
```yaml
- name: Deploy
  env:
    GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
  run: ./deploy.sh
```

---

## CI/CD Pipeline

### Automatic Workflows

Your project includes two GitHub Actions workflows:

**1. `deploy-pages.yml`** (Frontend)
- Triggers on push to `main`/`master`
- Builds React app with Vite
- Deploys to GitHub Pages
- ✅ Automatic, no configuration needed

**2. `ci.yml`** (Tests & Quality)
- Runs on every push and PR
- Tests Node.js 18
- Tests Python 3.9 and 3.11
- Lints code with flake8
- Builds frontend
- ✅ Automatic code quality checks

### Custom Deployments

To add automatic backend deployment to Render:

1. Go to **Render Dashboard**
2. Create Web Service
3. Enable "Auto-deploy"
4. Set "Branch" to `main` or `master`

---

## Deployment Checklist

- [ ] Create `.env` with all API keys
- [ ] Update `ALLOWED_ORIGINS` in backend for your domain
- [ ] Update API URL in `frontend/src/hooks/useMarketResearch.js`
- [ ] Test locally with `docker-compose up`
- [ ] Push to GitHub (triggers GitHub Actions)
- [ ] Deploy backend to Render/Railway/your platform
- [ ] Update frontend `.env` with production backend URL
- [ ] Test deployed frontend at your GitHub Pages URL
- [ ] Test backend API at your deployed backend URL
- [ ] Monitor logs in deployment platform

---

## Monitoring & Logging

### Render.com Logs

```bash
# View live logs
render logs your-service-name

# Export logs
render logs your-service-name --export > logs.txt
```

### GitHub Actions Logs

1. Go to **Actions** tab
2. Select workflow run
3. View logs for each job

### Application Health Check

```bash
# Test backend health
curl https://your-service-name.onrender.com/health

# Test API with sample query
curl -X POST https://your-service-name.onrender.com/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test query"}'
```

---

## Troubleshooting

### 502 Bad Gateway
- Check backend logs in Render dashboard
- Verify all environment variables are set
- Ensure `ALLOWED_ORIGINS` includes frontend URL

### CORS Errors
- Update `ALLOWED_ORIGINS` in backend
- Redeploy backend
- Clear browser cache

### Frontend showing "Cannot reach backend"
- Verify backend API URL in frontend code
- Check if backend is running
- Verify CORS settings

### Build failures
- Check logs in GitHub Actions
- Verify all dependencies in `requirements.txt`
- Ensure Python version compatibility

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [GitHub Pages Documentation](https://pages.github.com/)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

**Need help?** Open an issue on GitHub or check the main README.md
