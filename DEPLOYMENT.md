# VerifyID - Deployment Guide

This guide explains how to deploy VerifyID across multiple platforms.

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         User Browser                    │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐    ┌──────────────────┐
│ Vercel CDN   │    │  External APIs   │
│ (Frontend)   │    │ (Face Verify,    │
│              │    │  Payment)        │
└──────┬───────┘    └──────────────────┘
       │
       ▼
┌──────────────────────┐
│ Vercel Serverless    │
│ (Backend API)        │
│ /api/* routes        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ SQLite Database      │
│ (Local/Cloud)        │
└──────────────────────┘
```

---

## Part 1: Deploy Frontend on Vercel

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub repository with your code

### Steps

1. **Connect GitHub Repository to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   ```

2. **Push your changes to GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel configuration for deployment"
   git push origin master
   ```

3. **Deploy via Vercel CLI**
   ```bash
   vercel --prod
   ```

   Or connect directly on Vercel dashboard:
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework**: React
     - **Root Directory**: frontend
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

4. **Set Environment Variables in Vercel**
   ```
   VITE_API_URL = https://your-project.vercel.app/api
   VITE_FACE_VERIFICATION_URL = https://your-face-service.herokuapp.com
   VITE_PAYMENT_GATEWAY_URL = https://your-payment-service.herokuapp.com
   ```

---

## Part 2: Deploy Backend API on Vercel

### Steps

1. **Organize Backend for Vercel Serverless**
   
   The `api/` folder contains serverless functions. Each file becomes an endpoint:
   - `api/register.js` → `/api/register`
   - `api/login.js` → `/api/login`
   - `api/claim.js` → `/api/claim/submit`

2. **Create API Functions**
   
   Example structure:
   ```
   api/
   ├── register.js        # POST /api/register
   ├── login.js           # POST /api/login
   ├── claim-submit.js    # POST /api/claim/submit
   ├── claim-verify.js    # POST /api/claim/verify-otp
   ├── dashboard.js       # GET /api/dashboard/:id
   └── admin/
       ├── pending.js     # GET /api/admin/pending-claims
       └── review.js      # POST /api/admin/review-claim
   ```

3. **Deploy with Vercel**
   ```bash
   vercel --prod
   ```

4. **Set Backend Environment Variables**
   ```
   DATABASE_URL = ./database.sqlite
   JWT_SECRET = your-secret-key
   NODE_ENV = production
   ```

---

## Part 3: Deploy Python Services Separately

### Option A: Deploy on Heroku (Recommended for Hackathon)

#### Face Verification Service

1. **Create Heroku Account**
   - Sign up at https://www.heroku.com

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

3. **Create Procfile for Face Service**
   ```
   web: cd secureio && python app.py
   ```

4. **Deploy Face Service**
   ```bash
   heroku create verifyid-face-service
   heroku buildpacks:add heroku/python
   git push heroku master
   heroku open
   ```

5. **Get Service URL**
   - Your service runs at: `https://verifyid-face-service.herokuapp.com`
   - Update `VITE_FACE_VERIFICATION_URL` in Vercel

#### Payment Gateway Service

1. **Create Procfile for Payment Gateway**
   ```
   web: cd paymentgateway2 && python app.py
   ```

2. **Deploy Payment Gateway**
   ```bash
   heroku create verifyid-payment-gateway
   heroku buildpacks:add heroku/python
   git push heroku master
   heroku open
   ```

3. **Get Service URL**
   - Your service runs at: `https://verifyid-payment-gateway.herokuapp.com`
   - Update `VITE_PAYMENT_GATEWAY_URL` in Vercel

### Option B: Deploy on Railway

1. **Create Railway Account**
   - Sign up at https://railway.app

2. **Connect GitHub Repository**
   - Railway auto-detects Python projects
   - Set environment variables in dashboard

3. **Deploy**
   - Railway automatically deploys on git push
   - Service URL provided in dashboard

---

## Part 4: Database Management

### Option A: Keep SQLite Locally (Development Only)

```bash
# Backup database
cp backend-main/database.sqlite backup-database.sqlite

# Version control (add to .gitignore)
echo "database.sqlite" >> .gitignore
```

### Option B: Migrate to Cloud Database (Recommended)

**Use PostgreSQL on Railway or Heroku**

1. **Create PostgreSQL Database**
   ```bash
   # On Heroku
   heroku addons:create heroku-postgresql:hobby-dev
   heroku config:get DATABASE_URL
   ```

2. **Update Connection String**
   ```
   DATABASE_URL = postgresql://user:pass@host:port/dbname
   ```

3. **Migrate SQLite to PostgreSQL**
   - Use tools like pgloader or manual migration scripts

---

## Complete Deployment Checklist

### Frontend (Vercel)
- [ ] Connect GitHub to Vercel
- [ ] Set build command: `cd frontend && npm run build`
- [ ] Set output directory: `frontend/dist`
- [ ] Set environment variables (API URLs)
- [ ] Deploy and test

### Backend (Vercel)
- [ ] Create `api/` folder with serverless functions
- [ ] Set environment variables (JWT_SECRET, DATABASE_URL)
- [ ] Deploy and test endpoints
- [ ] Verify database connectivity

### Face Verification (Heroku/Railway)
- [ ] Create Procfile
- [ ] Set Python buildpack
- [ ] Install dependencies (requirements.txt)
- [ ] Deploy and test
- [ ] Get service URL

### Payment Gateway (Heroku/Railway)
- [ ] Create Procfile
- [ ] Set Python buildpack
- [ ] Install dependencies (requirements.txt)
- [ ] Deploy and test
- [ ] Get service URL

### Integration
- [ ] Update frontend env vars with service URLs
- [ ] Test API calls from frontend to all services
- [ ] Test face verification workflow
- [ ] Test payment gateway workflow
- [ ] Monitor logs and errors

---

## Monitoring & Debugging

### Vercel Logs
```bash
vercel logs
```

### Heroku Logs
```bash
heroku logs -a verifyid-face-service
heroku logs -a verifyid-payment-gateway
```

### Railway Logs
- View in dashboard: https://railway.app

---

## Cost Estimates

| Service | Plan | Cost/Month |
|---------|------|-----------|
| Vercel | Pro | $20 |
| Heroku | Eco | $7 each |
| Railway | Pay as you go | $5-15 |
| **Total** | | **$37-50** |

---

## Post-Deployment

1. **Test All Features**
   - User registration and login
   - Face verification
   - Professional claims
   - Payment transactions
   - Admin dashboard

2. **Monitor Performance**
   - Check Vercel analytics
   - Monitor API response times
   - Track error rates

3. **Set Up SSL/HTTPS**
   - Vercel: Automatic
   - Heroku: Automatic
   - Railway: Automatic

4. **Enable CORS** (if needed)
   ```javascript
   // In API handlers
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
   ```

---

## Troubleshooting

### "Build failed on Vercel"
- Check build logs: `vercel logs`
- Verify root directory setting
- Ensure all dependencies in package.json

### "Face verification service timeout"
- Check Heroku logs: `heroku logs -a service-name`
- Verify DeepFace model loaded
- Increase dyno size if needed

### "Database connection refused"
- Verify DATABASE_URL in environment variables
- Check SQLite file permissions
- For cloud DB: verify connection string

### "CORS errors in browser"
- Enable CORS in API handlers
- Allow frontend domain in backend
- Check API URL configuration

---

## Next Steps

1. Deploy frontend first (quick validation)
2. Deploy backend API (test endpoints)
3. Deploy Python services (test ML models)
4. Run full integration tests
5. Monitor for 24 hours
6. Document deployment notes for team

---

**Deployment Status**: Ready for production! 🚀
