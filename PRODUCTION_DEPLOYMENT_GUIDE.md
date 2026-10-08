# 🚀 Production Deployment Guide - ZO Platform

## Prerequisites Before Deployment

### 1. Generate Strong JWT Secrets

Open Command Prompt or Terminal and run this command TWICE:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

You will get two long random strings. Save them:
- First one = JWT_SECRET
- Second one = API_KEY_SECRET

Keep them safe! You'll need them later.

---

## Option A: Deploy to Railway (Recommended)

### Why Railway?
✅ Generous free tier ($5/month credit)
✅ Built-in MongoDB and Redis
✅ Auto-deploy from GitHub
✅ Very easy to use

### Step-by-Step Instructions:

#### Step 1: Upload to GitHub

1. Go to https://github.com and sign in
2. Click "+" icon (top right) → "New repository"
3. Name it: `zo-platform`
4. Make it Private
5. Click "Create repository"

6. Open Command Prompt in your project folder:
```bash
cd C:\Users\MARWAN\Desktop\zo-platform
```

7. Run these commands one by one:
```bash
git init
git add .
git commit -m "Initial commit - ZO Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zo-platform.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

#### Step 2: Sign Up for Railway

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub

#### Step 3: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `zo-platform` repository
4. Railway will start building automatically

#### Step 4: Add MongoDB Database

1. In Railway dashboard, click "+ New"
2. Select "Database" → "Add MongoDB"
3. Wait for it to deploy
4. Click on MongoDB service
5. Go to "Variables" tab
6. Copy the value of `MONGO_URL`

#### Step 5: Add Redis Database

1. Click "+ New" again
2. Select "Database" → "Add Redis"
3. Wait for it to deploy
4. Click on Redis service
5. Go to "Variables" tab
6. Copy values of:
   - REDIS_PUBLIC_URL (contains host, port, password)

#### Step 6: Configure Backend Environment Variables

1. Click on your main "zo-platform" service
2. Go to "Variables" tab
3. Click "New Variable" and add these ONE BY ONE:

```
NODE_ENV = production
MONGODB_URI = [paste MONGO_URL from Step 4]
REDIS_HOST = [extract from REDIS_PUBLIC_URL - the part after redis://]
REDIS_PORT = 6379
REDIS_PASSWORD = [extract from REDIS_PUBLIC_URL if present]
JWT_SECRET = [paste first secret from Prerequisites]
API_KEY_SECRET = [paste second secret from Prerequisites]
MAX_CONCURRENT_TASKS = 3
RATE_LIMIT_MAX_REQUESTS = 500
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = true
```

4. Click "Deploy" if it doesn't auto-deploy

#### Step 7: Get Your App URL

1. Go to "Settings" tab
2. Click "Generate Domain"
3. Your app will be at: `https://your-app-name.up.railway.app`

#### Step 8: Create First Admin User

1. In Railway dashboard, click on your service
2. Go to "Settings" → "Service"
3. Under "Deployments", find the latest successful deployment
4. You need to run the seed command

For now, you can create admin user manually after the app is running, or we can add a setup script.

---

## Option B: Deploy to Render

### Why Render?
✅ 100% free tier available
✅ Supports Docker
❌ No free MongoDB (need external service)

### Step-by-Step Instructions:

#### Step 1: Set Up MongoDB Atlas (Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (choose Free tier)
4. Wait 3-5 minutes for cluster creation
5. Click "Connect" → "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database password

#### Step 2: Set Up Redis (Free)

1. Go to https://redis.com/try-free/
2. Sign up for free account
3. Create a new database (Free 30MB)
4. Copy connection details:
   - Host
   - Port
   - Password

#### Step 3: Upload to GitHub

Follow the same steps as Railway Option (Step 1 in Option A)

#### Step 4: Deploy to Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Blueprint"
4. Connect your `zo-platform` repository
5. Render will read the `render.yaml` file automatically

#### Step 5: Add Environment Variables

In Render dashboard, add these variables:
```
MONGODB_URI = [paste from MongoDB Atlas]
REDIS_HOST = [paste from Redis Cloud]
REDIS_PORT = [paste from Redis Cloud]
REDIS_PASSWORD = [paste from Redis Cloud]
JWT_SECRET = [paste first secret]
API_KEY_SECRET = [paste second secret]
```

6. Click "Apply"

#### Step 6: Wait for Deployment

- First deploy takes 10-15 minutes
- Your app will be at: `https://zo-platform.onrender.com`

---

## Verify Deployment Success

After deployment, open this URL in browser:
```
https://your-app-url/health
```

You should see:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "redis": "connected",
  ...
}
```

If mongodb or redis shows "disconnected", check your environment variables.

---

## First Login

Default admin credentials (created by seed script):
- Email: `admin@zo-platform.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## Troubleshooting

### Problem: "Out of Memory" Error
**Solution:** Reduce concurrent tasks
```
MAX_CONCURRENT_TASKS=1
```

### Problem: "MongoDB connection failed"
**Solution:**
- Check MONGODB_URI is correct
- Ensure IP whitelist allows all IPs (0.0.0.0/0) in MongoDB Atlas

### Problem: "Redis timeout"
**Solution:**
- Verify REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- Check Redis service is running

### Problem: Frontend shows blank page
**Solution:**
- Check browser console for errors
- Verify build completed successfully in deployment logs

---

## Next Steps

1. ✅ Change admin password
2. ✅ Create API keys for n8n integration
3. ✅ Test creating a scraping task
4. ✅ Monitor resource usage
5. ✅ Set up monitoring (optional)

---

## Support

If you encounter issues:
1. Check deployment logs in Railway/Render dashboard
2. Look for error messages
3. Verify all environment variables are set correctly

🎉 Congratulations! Your ZO Platform is now live!