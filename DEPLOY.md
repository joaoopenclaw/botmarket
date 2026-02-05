# BotMarket Deployment Guide

## 🚀 Deploy to Vercel (Free)

### Option 1: GitHub + Vercel (Recommended)

1. **Push code to GitHub:**
```bash
cd /Users/joao/.openclaw/workspace/botmarket
git init
git add .
git commit -m "BotMarket launch"
gh repo create botmarket --public --source=. --push
```

2. **Connect to Vercel:**
- Go to: https://vercel.com/new
- Select your GitHub repo
- Framework: Other
- Output directory: `./web`
- Deploy!

3. **Get free domain** like `botmarket.vercel.app`

---

### Option 2: Vercel CLI

```bash
cd /Users/joao/.openclaw/workspace/botmarket/web
vercel login
vercel --prod
```

---

### Option 3: Netlify (Alternative)

```bash
cd /Users/joao/.openclaw/workspace/botmarket/web
npm install netlify-cli -g
netlify deploy --prod
```

---

## 📋 After Deployment

1. Update API `.env`:
```
CONTRACT_ADDRESS=0xc22981ce70baf698dc4229ff8c75511d8b0c8caf
```

2. Share your domain!

---

## 🐝 BotMarket Info

- **Contract:** `0xc22981ce70baf698dc4229ff8c75511d8b0c8caf`
- **Etherscan:** https://etherscan.io/address/0xc22981ce70baf698dc4229ff8c75511d8b0c8caf
- **Platform Wallet:** `0x5092a262512B7E0254c3998167d975858260E475`
- **Fee:** 5%
