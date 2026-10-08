# Railway Deployment Fix Request

## Problem Summary
We're trying to deploy the zo-platform project on Railway.app (free tier, no credit card required) but encountering repeated build failures with the error:
```
/bin/bash: line 1: npm: command not found
Build Failed: build daemon returned an error
```

## Current Project Structure
```
zo-platform/
├── frontend/          (React app)
│   ├── package.json
│   ├── src/
│   └── public/
├── backend/           (Node.js/Express API)
│   ├── package.json
│   ├── server.js
│   └── ...
├── package.json       (root - has scripts for monorepo)
├── Dockerfile.backup  (renamed, not using)
└── railway.toml       (tried, not working)
```

## What We Need

**Fix the project structure to deploy successfully on Railway.app**

### Requirements:
1. Railway should detect and install Node.js properly
2. Build should install dependencies for both frontend and backend
3. Build should compile frontend (React)
4. Start command should run the backend server
5. Backend should serve the built frontend as static files in production

### Constraints:
- **Keep the monorepo structure** (frontend/ and backend/ folders)
- **Backend must serve built frontend** in production (single service deployment)
- Use **Nixpacks** as the builder (Railway default for Node.js)
- **No Docker** (removed Dockerfile already)

### Environment Variables (already configured in Railway):
- NODE_ENV=production
- PORT=3000
- MONGODB_URI=mongodb+srv://...
- REDIS_HOST=...
- REDIS_PORT=17244
- REDIS_PASSWORD=...
- JWT_SECRET=...
- API_KEY_SECRET=...
- FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
- MAX_CONCURRENT_TASKS=3
- RATE_LIMIT_MAX_REQUESTS=500

## What to Fix

1. **Review and fix the root package.json** scripts
2. **Create or fix railway.toml** with correct build/start commands
3. **Ensure backend serves frontend static files** (check server.js)
4. **Make sure all paths are correct** for Railway's /app directory
5. **Test that the build process works** with Railway's environment

## Expected Outcome

After your fixes:
- Railway build should succeed
- Frontend should be accessible at the Railway domain
- Backend API should work at /api/* routes
- Both should be served from a single Railway service

## Files to Focus On
- `/package.json` (root)
- `/railway.toml` (create/fix)
- `/backend/server.js` (ensure it serves frontend static files)
- `/backend/package.json` (verify scripts)
- `/frontend/package.json` (verify build script)

## Additional Notes
- We already removed Dockerfile and docker-compose.yml
- Railway is detecting the project from GitHub
- Build keeps failing at npm install stage (npm not found)
- The project works fine locally with `npm run dev`

Please make all necessary changes to make this work on Railway!
