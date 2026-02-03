# Quick Reference: Chosen Stack
## Cloudflare + Astro + Cloudflare Functions + Supabase

---

## 🎯 Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Astro (SSG) | Static site generation |
| **Hosting** | Cloudflare Pages | CDN + hosting |
| **Database** | Supabase | PostgreSQL + real-time |
| **API** | Cloudflare Functions | Edge-deployed endpoints |

---

## 💰 Costs

- **MVP**: $0/month ✅
- **Scale**: $0-30/month ✅
- **Large Scale**: $30/month ($5 Cloudflare + $25 Supabase)

---

## ⚡ Performance

- **Frontend**: <1s load time (static files)
- **Database**: ~50-100ms (direct queries)
- **API**: ~0-50ms (edge-deployed)
- **Real-time**: WebSocket subscriptions

---

## 🚀 Quick Start

### 1. Initialize Astro
```bash
npm create astro@latest
cd your-project
npm install @astrojs/cloudflare @supabase/supabase-js
```

### 2. Configure Astro
```javascript
// astro.config.mjs
export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
})
```

### 3. Set up Supabase
```bash
npm install -g supabase
supabase init
supabase start
```

### 4. Create Cloudflare Function
```typescript
// functions/api/example.ts
export async function onRequestPost({ request, env }) {
  return new Response(JSON.stringify({ success: true }))
}
```

### 5. Deploy
```bash
# Deploy to Cloudflare Pages
npm run build
# Connect GitHub repo in Cloudflare Dashboard
```

---

## 📝 Common Patterns

### Direct Database Query
```typescript
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
```

### Real-time Subscription
```typescript
const channel = supabase
  .channel('room-123')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers' }, 
    (payload) => handleChange(payload.new)
  )
  .subscribe()
```

### Cloudflare Function
```typescript
export async function onRequestPost({ request, env }) {
  const data = await request.json()
  // Process...
  return new Response(JSON.stringify(result))
}
```

---

## 🔗 Key Links

- **Astro Docs**: https://docs.astro.build
- **Cloudflare Pages**: https://developers.cloudflare.com/pages
- **Supabase Docs**: https://supabase.com/docs
- **Final Architecture**: See FINAL-ARCHITECTURE.md

---

## ✅ Decision Summary

**Why This Stack?**
- ✅ Lowest cost ($0-30/month)
- ✅ Best performance (edge-deployed)
- ✅ Infinite auto-scaling
- ✅ Best security (multi-layer)
- ✅ Excellent DX

**See FINAL-ARCHITECTURE.md for complete details.**
