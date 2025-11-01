# Railway Deployment Instructions

## ✅ Completed Steps

Your citizen-reporting project is now fully set up and pushed to GitHub at:
**https://github.com/rga610/citizen-reporting-react**

All scaffolding, migrations, and build configurations are in place.

## 🚀 Next Steps for Railway

Railway should automatically redeploy with the latest push. Here's what should happen:

### 1. **Verify Deployment**
- Go to your Railway project dashboard
- Check the latest deployment (should be triggered automatically from the push)
- Wait for build to complete

### 2. **Check Database Tables**
After deployment, your PostgreSQL database should now have:
- ✅ `Session`
- ✅ `Participant`
- ✅ `Issue`
- ✅ `Scan`
- ✅ `_prisma_migrations` (internal tracking)

### 3. **Seed Initial Data** (Optional)
If you want to populate initial issues from `data/issues.csv`:

1. In Railway dashboard, open your service's terminal
2. Run: `cd api && pnpm run seed`
3. This will create `ISSUE_A01`, `ISSUE_A02`, `ISSUE_B01` in your database

### 4. **Verify API Endpoints**
Once deployed, test these endpoints:

- `GET /api/health` - Should return `{"ok":true}`
- `GET /api/join` - Creates a participant and returns treatment assignment
- `POST /api/report` - Submits a scan/report

### 5. **Environment Variables**
Ensure these are set in Railway (Service → Variables):
- `DATABASE_URL` ✅ (auto-connected from Postgres service)
- `COOKIE_SECRET` ✅ (you configured this: `6BBEC9B84FA2C943B522749BDCDA2`)
- `SESSION_SLOT` ✅ (you set: `1`)
- `ADMIN_TOKEN` ✅ (you set: `21C34`)
- `NODE_ENV=production`

### 6. **Get Your API URL**
- Railway provides an HTTPS domain like `https://xxx-production.up.railway.app`
- Use this for testing the API endpoints

## 🧪 Test Locally (Optional)

If you want to test the full stack locally before the field experiment:

```bash
# Terminal 1 - API
cd api
corepack pnpm run dev

# Terminal 2 - Web Frontend  
cd web
corepack pnpm run dev

# Open http://localhost:5173
```

## 📋 What's Next?

1. **Complete Web UI**: Add QR scanner component, real-time SSE displays for treatments
2. **Admin Dashboard**: Build interface for viewing stats and exporting CSVs
3. **Survey Component**: Add exit survey form
4. **Testing**: Test all treatment flows, cooperative/competitive leaderboards, etc.
5. **Pre-flight Checklist**: Verify mobile browser compatibility, PWA install behavior

## 🆘 Troubleshooting

If migrations didn't run:
- Check Railway deploy logs
- Verify `DATABASE_URL` is correct
- Try manual deploy: open terminal in Railway and run `cd api && npx prisma migrate deploy --schema=src/prisma/schema.prisma`

If you need help, check `/Implementation Plan & Technical Documentation.md` for detailed architecture.

