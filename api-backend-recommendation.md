# Backend API Recommendation
## Astro + Supabase + Cloudflare Functions

---

## 🎯 Your Stack

- **Frontend**: Astro (SSG)
- **Database**: Supabase (direct client access)
- **Hosting**: Cloudflare Pages
- **API Endpoints**: **Cloudflare Functions** ✅

---

## 🏆 Recommended: Cloudflare Functions/Workers

### Why Cloudflare Functions is Perfect

| Requirement | Cloudflare Functions | Why It's Perfect |
|-------------|---------------------|------------------|
| **Low Cost** | ✅ Free: 100k requests/day<br>$5/mo: Unlimited | Stays under $10/month |
| **Super Fast** | ✅ Edge-deployed (200+ locations)<br>~0-50ms latency | Runs at edge, closest to users |
| **Low Bandwidth** | ✅ Edge processing<br>Only sends results | Processes at edge, minimal data transfer |
| **Auto-scaling** | ✅ Infinite scale<br>No cold starts | Handles traffic spikes automatically |
| **Performance** | ✅ V8 isolates<br>Sub-millisecond startup | Fastest serverless runtime |

---

## 💰 Cost Comparison

### Cloudflare Functions

| Tier | Requests/Day | Cost |
|------|-------------|------|
| **Free** | 100,000 | **$0/month** ✅ |
| **Workers Paid** | Unlimited | **$5/month** ✅ |

**Your App Scale**:
- MVP: 300 games/week = ~1,300/month
- API calls: ~5-10 per game = 6,500-13,000/month
- **Cost**: **$0/month** ✅ (well under 100k/day)

### Alternatives Comparison

| Option | Free Tier | Cost at Scale | Latency | Auto-scale |
|--------|-----------|---------------|---------|------------|
| **Cloudflare Functions** | ✅ 100k/day | **$5/mo** | 🟢 ~0-50ms | ✅ Yes |
| **Supabase Edge Functions** | ✅ 500k/month | **$25/mo** | 🟡 ~100-200ms | ✅ Yes |
| **Vercel Edge Functions** | ✅ 100k/day | **$20/mo** | 🟢 ~0-50ms | ✅ Yes |
| **Railway** | ❌ No | **$5-20/mo** | 🟡 ~100-300ms | ⚠️ Limited |
| **Render** | ❌ No | **$7-25/mo** | 🟡 ~100-300ms | ⚠️ Limited |

**Winner**: **Cloudflare Functions** - Lowest cost, fastest, already using Cloudflare!

---

## ⚡ Performance Benefits

### Edge Deployment

**Cloudflare Functions** run at **200+ edge locations** globally:

```
User (Tokyo) → Cloudflare Edge (Tokyo) → Response
Latency: ~5-10ms ✅

vs Traditional API:
User (Tokyo) → API Server (US) → Response
Latency: ~150-200ms ❌
```

**Result**: **20-40x faster** for global users!

### Bandwidth Optimization

**Cloudflare Functions** process at edge, only send results:

```
Traditional API:
Client → API Server → Supabase → Process → API Server → Client
Bandwidth: 2x (request + response)

Cloudflare Functions:
Client → Edge Function → Supabase → Process → Client
Bandwidth: 1x (only response, processing at edge)
```

**Result**: **50% less bandwidth**!

---

## 🚀 Implementation

### 1. Create Cloudflare Function

**File**: `functions/api/calculate-score.ts`

```typescript
// functions/api/calculate-score.ts
export async function onRequestPost({ request, env }) {
  try {
    const { roomId, category } = await request.json()

    // Call Supabase directly from edge function
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rpc/calculate_compatibility`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_room_id: roomId,
          p_category: category
        })
      }
    )

    const score = await response.json()

    return new Response(JSON.stringify({ 
      success: true,
      score 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
```

### 2. Environment Variables

**`.env`** (local):
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your-local-service-key
```

**Cloudflare Pages** (production):
- Set in Cloudflare Dashboard → Pages → Settings → Environment Variables

### 3. Call from Astro Client

```typescript
// lib/api.ts
export async function calculateCompatibilityScore(roomId: string, category: string) {
  const response = await fetch('/api/calculate-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ roomId, category })
  })

  if (!response.ok) {
    throw new Error('Failed to calculate score')
  }

  return response.json()
}
```

**Usage**:
```typescript
// components/GameRoom.astro
import { calculateCompatibilityScore } from '../lib/api'

const result = await calculateCompatibilityScore(roomId, 'relationship_dynamics')
console.log('Score:', result.score)
```

---

## 📊 When to Use Cloudflare Functions

### ✅ Use Functions For:

1. **Complex Calculations**
   - Compatibility scoring algorithms
   - Data aggregation
   - Statistical analysis

2. **External API Calls**
   - Third-party integrations
   - Payment processing
   - Email sending

3. **Sensitive Operations**
   - Admin actions
   - Data validation
   - Rate limiting

4. **Heavy Processing**
   - Image processing
   - Data transformation
   - Batch operations

### ❌ Don't Use Functions For:

1. **Simple CRUD** → Use Supabase direct queries
2. **Real-time subscriptions** → Use Supabase Realtime
3. **User data queries** → Use Supabase RLS
4. **Basic filtering** → Use Supabase queries

---

## 🎯 Architecture Pattern

### Recommended Architecture

```
┌─────────────────┐
│   Astro Client  │
│    (SSG/CSR)    │
└────────┬────────┘
         │
         ├─── Direct Queries (90% of operations)
         │    ↓
         │    Supabase PostgREST API
         │    ↓
         │    PostgreSQL Database
         │
         └─── API Calls (10% - complex operations)
              ↓
              Cloudflare Functions (Edge)
              ↓
              Supabase (via Service Key)
              ↓
              PostgreSQL Database
```

**90% Direct Queries** (fast, free):
- User profiles
- Game rooms
- Questions
- Answers
- Real-time subscriptions

**10% API Calls** (complex operations):
- Compatibility scoring
- External integrations
- Admin operations

---

## 🔧 Complete Example: Compatibility Scoring

### 1. Database Function (Supabase)

```sql
-- supabase/migrations/20240101000000_compatibility_function.sql
CREATE OR REPLACE FUNCTION calculate_compatibility(
  p_room_id UUID,
  p_category TEXT
) RETURNS JSON AS $$
DECLARE
  v_score INTEGER := 0;
  v_total_questions INTEGER;
  v_answered_questions INTEGER;
  v_matching_answers INTEGER;
BEGIN
  -- Count total questions in category
  SELECT COUNT(*) INTO v_total_questions
  FROM questions
  WHERE category = p_category;

  -- Count answered questions
  SELECT COUNT(DISTINCT question_id) INTO v_answered_questions
  FROM answers
  WHERE room_id = p_room_id
    AND EXISTS (
      SELECT 1 FROM questions
      WHERE questions.id = answers.question_id
      AND questions.category = p_category
    );

  -- Count matching answers
  SELECT COUNT(*) INTO v_matching_answers
  FROM answers a1
  JOIN answers a2 ON a1.question_id = a2.question_id
  WHERE a1.room_id = p_room_id
    AND a2.room_id = p_room_id
    AND a1.user_id != a2.user_id
    AND a1.answer_value = a2.answer_value
    AND EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = a1.question_id
      AND q.category = p_category
    );

  -- Calculate score (0-100)
  IF v_answered_questions > 0 THEN
    v_score := ROUND((v_matching_answers::NUMERIC / v_answered_questions::NUMERIC) * 100);
  END IF;

  RETURN json_build_object(
    'score', v_score,
    'total_questions', v_total_questions,
    'answered_questions', v_answered_questions,
    'matching_answers', v_matching_answers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Cloudflare Function

```typescript
// functions/api/calculate-score.ts
export async function onRequestPost({ request, env }) {
  const { roomId, category } = await request.json()

  // Call Supabase function
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/rpc/calculate_compatibility`,
    {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_room_id: roomId,
        p_category: category
      })
    }
  )

  const result = await response.json()

  // Store score in database
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/compatibility_scores`,
    {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room_id: roomId,
        category,
        score: result.score,
        questions_answered: result.answered_questions,
        questions_total: result.total_questions,
        calculated_at: new Date().toISOString()
      })
    }
  )

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 3. Client Usage

```typescript
// lib/api.ts
export async function calculateScore(roomId: string, category: string) {
  const response = await fetch('/api/calculate-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, category })
  })

  return response.json()
}
```

---

## 🚀 Alternative: Supabase Edge Functions

### When to Consider

If you want everything in one place (Supabase):

**Pros**:
- ✅ Integrated with Supabase
- ✅ Same authentication
- ✅ Free tier: 500k invocations/month

**Cons**:
- ⚠️ Higher latency (~100-200ms vs ~0-50ms)
- ⚠️ More expensive ($25/mo at scale)
- ⚠️ Less edge locations

### Supabase Edge Function Example

```typescript
// supabase/functions/calculate-score/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { roomId, category } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase.rpc('calculate_compatibility', {
    p_room_id: roomId,
    p_category: category
  })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Recommendation**: Use **Cloudflare Functions** - faster, cheaper, already using Cloudflare!

---

## 📈 Performance Comparison

### Latency (Global Average)

| Option | Latency | Why |
|--------|---------|-----|
| **Cloudflare Functions** | **~0-50ms** 🟢 | Edge-deployed (200+ locations) |
| Supabase Edge Functions | ~100-200ms 🟡 | Fewer edge locations |
| Vercel Edge Functions | ~0-50ms 🟢 | Edge-deployed |
| Railway/Render | ~100-300ms 🔴 | Single region |

### Bandwidth Usage

| Option | Bandwidth | Why |
|--------|-----------|-----|
| **Cloudflare Functions** | **Lowest** 🟢 | Processes at edge, only sends results |
| Supabase Edge Functions | Medium 🟡 | Processes centrally |
| Traditional API | Highest 🔴 | Full round-trip |

---

## 💡 Best Practices

### 1. Use Direct Queries When Possible

```typescript
// ✅ GOOD: Direct query (fast, free)
const { data } = await supabase
  .from('game_rooms')
  .select('*')
  .eq('id', roomId)

// ❌ BAD: Unnecessary API call
const response = await fetch('/api/game-room', {
  body: JSON.stringify({ roomId })
})
```

### 2. Cache Results

```typescript
// functions/api/calculate-score.ts
export async function onRequestPost({ request, env }) {
  const { roomId, category } = await request.json()

  // Check cache first
  const cacheKey = `score:${roomId}:${category}`
  const cached = await env.SCORES_CACHE.get(cacheKey)
  
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Calculate score
  const score = await calculateScore(roomId, category)

  // Cache for 5 minutes
  await env.SCORES_CACHE.put(cacheKey, JSON.stringify(score), {
    expirationTtl: 300
  })

  return new Response(JSON.stringify(score), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 3. Batch Operations

```typescript
// ✅ GOOD: Batch multiple scores
const scores = await Promise.all([
  calculateScore(roomId, 'category1'),
  calculateScore(roomId, 'category2'),
  calculateScore(roomId, 'category3')
])

// ❌ BAD: Sequential calls
const score1 = await calculateScore(roomId, 'category1')
const score2 = await calculateScore(roomId, 'category2')
const score3 = await calculateScore(roomId, 'category3')
```

---

## 🔒 Security

### Environment Variables

**Never expose service keys in client code!**

```typescript
// ✅ GOOD: Use environment variables
const response = await fetch(
  `${env.SUPABASE_URL}/rest/v1/...`,
  {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY, // Server-side only!
    }
  }
)

// ❌ BAD: Never do this in client!
const SUPABASE_SERVICE_KEY = 'eyJ...' // Exposed!
```

### Rate Limiting

```typescript
// functions/api/calculate-score.ts
export async function onRequestPost({ request, env }) {
  const clientIp = request.headers.get('CF-Connecting-IP')
  const rateLimitKey = `rate_limit:${clientIp}`

  // Check rate limit (10 requests per minute)
  const count = await env.RATE_LIMIT.get(rateLimitKey)
  if (count && parseInt(count) >= 10) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Increment counter
  await env.RATE_LIMIT.put(rateLimitKey, (parseInt(count || '0') + 1).toString(), {
    expirationTtl: 60
  })

  // Process request...
}
```

---

## 📝 Complete Setup Guide

### 1. Install Wrangler (Cloudflare CLI)

```bash
npm install -g wrangler
wrangler login
```

### 2. Create Function

```bash
# Functions are automatically detected in functions/ folder
mkdir -p functions/api
```

### 3. Deploy

```bash
# Deploy to Cloudflare Pages
# Functions are automatically deployed with Pages!

# Or deploy Workers separately
wrangler deploy
```

### 4. Environment Variables

**Cloudflare Dashboard**:
1. Go to Pages → Your Project → Settings
2. Environment Variables
3. Add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

---

## ✅ Summary

### Recommended Stack

- **Frontend**: Astro (SSG)
- **Database**: Supabase (direct queries)
- **API Endpoints**: **Cloudflare Functions** ✅
- **Hosting**: Cloudflare Pages

### Why Cloudflare Functions?

1. ✅ **Lowest Cost** - Free: 100k/day, $5/mo unlimited
2. ✅ **Fastest** - Edge-deployed, ~0-50ms latency
3. ✅ **Low Bandwidth** - Processes at edge
4. ✅ **Auto-scaling** - Infinite scale, no cold starts
5. ✅ **Already Using** - Cloudflare Pages integration

### Architecture

- **90% Direct Queries** → Supabase (fast, free)
- **10% API Calls** → Cloudflare Functions (complex operations)

**Total Cost**: **$0-5/month** ✅ (stays under $10!)

---

## Questions?

Would you like me to:
1. Create example Cloudflare Functions for your game app?
2. Set up compatibility scoring function?
3. Create rate limiting middleware?
4. Set up caching strategies?
