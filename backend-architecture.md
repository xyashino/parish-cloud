# Backend Architecture: Direct Client-to-DB Pattern
## Astro Frontend + Supabase Backend

---

## 🎯 Architecture Philosophy

**Goal**: Minimize API calls, maximize direct database access from client
**Pattern**: Client → Supabase (PostgREST) → PostgreSQL
**Security**: Row Level Security (RLS) policies enforce data access rules

---

## 🏆 Recommended Stack: Supabase

### Why Supabase is Perfect for Your Use Case

| Feature | Benefit for Your App |
|---------|---------------------|
| **PostgREST API** | Direct client-to-DB queries (no backend needed) |
| **Row Level Security** | Security enforced at DB level (no API middleware) |
| **Real-time** | Built-in WebSocket subscriptions for game sessions |
| **Auth** | Google OAuth + Email/Password built-in |
| **Free Tier** | 500MB DB, 2GB storage, 2GB bandwidth - generous |
| **Performance** | PostgreSQL is fast, queries optimized automatically |
| **Auto-scaling** | Handles traffic spikes automatically |

### Cost Breakdown

| Service | Free Tier | When You Pay | Cost |
|---------|-----------|--------------|------|
| **Supabase** | 500MB DB, 2GB storage, 2GB bandwidth | >2GB bandwidth/month | **$25/mo** (Pro) |
| **Cloudflare Pages** | Unlimited bandwidth | Never (for your scale) | **$0** |
| **Cloudflare Functions** | 100k requests/day | >100k/day | **$5/mo** |
| **Total MVP** | - | - | **$0/month** ✅ |
| **Total at Scale** | - | - | **$0-30/month** ✅ |

---

## 📊 Data Model Design

### Core Tables

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Rooms
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id),
  partner_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'waiting', -- waiting, active, completed, paused
  current_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions (static data, can be seeded)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- relationship_dynamics, self_discovery, etc.
  difficulty TEXT NOT NULL, -- easy, medium, hard
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- multiple_choice, scale, yes_no, open_text
  options JSONB, -- For multiple choice: ["Option A", "Option B"]
  time_limit_seconds INTEGER, -- 30-120
  educational_tip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers (user-centric data)
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id),
  question_id UUID REFERENCES questions(id),
  user_id UUID REFERENCES profiles(id),
  answer_value TEXT NOT NULL, -- JSON stringified for complex answers
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  skipped BOOLEAN DEFAULT FALSE,
  saved_for_later BOOLEAN DEFAULT FALSE,
  UNIQUE(room_id, question_id, user_id)
);

-- Compatibility Scores (calculated, user-centric)
CREATE TABLE compatibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id),
  category TEXT NOT NULL,
  user1_id UUID REFERENCES profiles(id),
  user2_id UUID REFERENCES profiles(id),
  score INTEGER, -- 0-100
  questions_answered INTEGER,
  questions_total INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, category)
);

-- Answer History (user-centric)
CREATE TABLE answer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  question_id UUID REFERENCES questions(id),
  answer_value TEXT,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  room_id UUID REFERENCES game_rooms(id)
);
```

---

## 🔒 Row Level Security (RLS) Policies

### Security Pattern: Enforce at Database Level

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Game Rooms: Users can only access rooms they're part of
CREATE POLICY "Users can view rooms they're in"
  ON game_rooms FOR SELECT
  USING (
    auth.uid() = created_by OR 
    auth.uid() = partner_id
  );

CREATE POLICY "Users can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their rooms"
  ON game_rooms FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    auth.uid() = partner_id
  );

-- Answers: Users can only see answers in their rooms
CREATE POLICY "Users can view answers in their rooms"
  ON answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_rooms
      WHERE game_rooms.id = answers.room_id
      AND (game_rooms.created_by = auth.uid() OR game_rooms.partner_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own answers"
  ON answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers"
  ON answers FOR UPDATE
  USING (auth.uid() = user_id);

-- Questions: Public read (static data)
CREATE POLICY "Anyone can read questions"
  ON questions FOR SELECT
  USING (true);

-- Compatibility Scores: Users can only see scores for their rooms
CREATE POLICY "Users can view scores in their rooms"
  ON compatibility_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_rooms
      WHERE game_rooms.id = compatibility_scores.room_id
      AND (game_rooms.created_by = auth.uid() OR game_rooms.partner_id = auth.uid())
    )
  );
```

---

## 💻 Direct Client Queries (No API Needed!)

### Pattern: Client → Supabase → PostgreSQL

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Example 1: Get User Profile (Direct Query)

```typescript
// No API call needed! Direct DB query
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// RLS ensures user can only access their own profile
```

### Example 2: Create Game Room (Direct Insert)

```typescript
// No API call needed! Direct DB insert
const { data: room, error } = await supabase
  .from('game_rooms')
  .insert({
    created_by: userId,
    status: 'waiting'
  })
  .select()
  .single()

// RLS ensures user can only create rooms as themselves
```

### Example 3: Get Questions by Category (Direct Query)

```typescript
// No API call needed! Questions are public
const { data: questions, error } = await supabase
  .from('questions')
  .select('*')
  .eq('category', 'relationship_dynamics')
  .eq('difficulty', 'easy')
  .order('created_at')

// RLS allows public read access
```

### Example 4: Submit Answer (Direct Insert)

```typescript
// No API call needed! Direct DB insert
const { data: answer, error } = await supabase
  .from('answers')
  .insert({
    room_id: roomId,
    question_id: questionId,
    user_id: userId,
    answer_value: JSON.stringify(answerData),
    answered_at: new Date().toISOString()
  })
  .select()
  .single()

// RLS ensures user can only insert their own answers
```

### Example 5: Get Partner's Answer (Real-time Subscription)

```typescript
// No API call needed! Real-time subscription
const channel = supabase
  .channel(`room-${roomId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'answers',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      // Partner's answer received in real-time!
      if (payload.new.user_id !== userId) {
        handlePartnerAnswer(payload.new)
      }
    }
  )
  .subscribe()

// RLS ensures user only sees answers from their rooms
```

### Example 6: Get Compatibility Score (Direct Query)

```typescript
// No API call needed! Direct DB query
const { data: scores, error } = await supabase
  .from('compatibility_scores')
  .select('*')
  .eq('room_id', roomId)
  .order('calculated_at', { ascending: false })

// RLS ensures user only sees scores from their rooms
```

### Example 7: Get Answer History (Direct Query)

```typescript
// No API call needed! Direct DB query
const { data: history, error } = await supabase
  .from('answer_history')
  .select(`
    *,
    questions (
      question_text,
      category,
      difficulty
    )
  `)
  .eq('user_id', userId)
  .order('answered_at', { ascending: false })
  .limit(50)

// RLS ensures user only sees their own history
```

---

## 🔧 When to Use Cloudflare Functions (Rare Cases)

### Only for Complex Business Logic

Use Cloudflare Functions ONLY when you need:
1. **Complex calculations** (compatibility scoring algorithm)
2. **External API calls** (third-party integrations)
3. **Sensitive operations** (payment processing, admin actions)

### Example: Calculate Compatibility Score

```typescript
// functions/api/calculate-score.ts
export async function onRequestPost({ request, env }) {
  const { roomId, category } = await request.json()
  
  // Complex scoring algorithm
  const score = await calculateCompatibilityScore(roomId, category)
  
  // Store result in DB
  await fetch(`${env.SUPABASE_URL}/rest/v1/compatibility_scores`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      room_id: roomId,
      category,
      score: score.total,
      questions_answered: score.answered,
      questions_total: score.total
    })
  })
  
  return new Response(JSON.stringify({ score }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function calculateCompatibilityScore(roomId: string, category: string) {
  // Complex logic here
  // Compare answers, calculate similarity, apply difficulty weights, etc.
  return { total: 85, answered: 10, total: 12 }
}
```

**Why use Function here?**
- Complex algorithm (harder to do in SQL)
- Can be cached/optimized server-side
- Doesn't need to run on every client

---

## 📈 Performance Benefits

### Direct Client-to-DB vs Traditional API

| Metric | Traditional API | Direct Client-to-DB |
|--------|----------------|---------------------|
| **Request Path** | Client → API → DB → API → Client | Client → DB → Client |
| **Latency** | ~100-200ms | ~50-100ms |
| **Bandwidth** | 2x (request + response) | 1x (direct) |
| **Server Load** | High (API server processes) | Low (DB handles) |
| **Cost** | API hosting + DB | DB only |

### Real-world Example

**Traditional API Pattern**:
```
User submits answer
→ Client sends to /api/answers (50ms)
→ API validates (10ms)
→ API queries DB (30ms)
→ API processes response (10ms)
→ API sends to client (50ms)
Total: ~150ms, 2x bandwidth
```

**Direct Client-to-DB Pattern**:
```
User submits answer
→ Client sends directly to Supabase (30ms)
→ Supabase validates with RLS (5ms)
→ Supabase queries DB (20ms)
→ Supabase sends to client (30ms)
Total: ~85ms, 1x bandwidth
```

**Result**: ~43% faster, 50% less bandwidth ✅

---

## 🎮 Complete Flow Example: Game Session

### Step 1: Create Room (Direct DB)

```typescript
// components/GameRoom.astro
const { data: room } = await supabase
  .from('game_rooms')
  .insert({ created_by: userId })
  .select()
  .single()
```

### Step 2: Load Questions (Direct DB)

```typescript
// No API needed - questions are public
const { data: questions } = await supabase
  .from('questions')
  .select('*')
  .eq('category', selectedCategory)
  .order('difficulty')
```

### Step 3: Submit Answer (Direct DB)

```typescript
// Direct insert, RLS handles security
const { data: answer } = await supabase
  .from('answers')
  .insert({
    room_id: roomId,
    question_id: questionId,
    user_id: userId,
    answer_value: answerValue
  })
```

### Step 4: Wait for Partner (Real-time Subscription)

```typescript
// Real-time subscription, no polling needed
const channel = supabase
  .channel(`room-${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'answers',
    filter: `room_id=eq.${roomId} AND question_id=eq.${questionId}`
  }, (payload) => {
    // Partner answered!
    if (payload.new.user_id !== userId) {
      showResults(payload.new)
    }
  })
  .subscribe()
```

### Step 5: Calculate Score (Cloudflare Function - Complex Logic)

```typescript
// Only complex calculations use Functions
const response = await fetch('/api/calculate-score', {
  method: 'POST',
  body: JSON.stringify({ roomId, category })
})
const { score } = await response.json()
```

### Step 6: Get Score History (Direct DB)

```typescript
// Direct query for scores
const { data: scores } = await supabase
  .from('compatibility_scores')
  .select('*')
  .eq('room_id', roomId)
  .order('calculated_at')
```

---

## 🔐 Security Architecture

### Multi-Layer Security

1. **Authentication Layer** (Supabase Auth)
   - Google OAuth
   - Email/Password
   - JWT tokens

2. **Authorization Layer** (RLS Policies)
   - Database-level security
   - No API middleware needed
   - Policies enforced automatically

3. **Network Layer** (Cloudflare)
   - DDoS protection
   - WAF rules
   - Rate limiting

### Security Best Practices

```typescript
// ✅ GOOD: Use RLS policies
// Client can query directly, RLS enforces security
const { data } = await supabase
  .from('answers')
  .select('*')
  .eq('room_id', roomId)

// ❌ BAD: Don't expose service key to client
// Never use SUPABASE_SERVICE_KEY in client code!
const supabase = createClient(url, serviceKey) // ❌ NEVER!
```

---

## 📊 Database Functions (PostgreSQL)

### Use DB Functions for Complex Queries

```sql
-- Calculate compatibility score in DB (faster than client)
CREATE OR REPLACE FUNCTION calculate_compatibility(
  p_room_id UUID,
  p_category TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER;
BEGIN
  SELECT COUNT(*) * 10 INTO v_score
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
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Call from Client

```typescript
// Call DB function directly from client
const { data, error } = await supabase.rpc('calculate_compatibility', {
  p_room_id: roomId,
  p_category: category
})
```

---

## 🚀 Performance Optimization

### 1. Indexes for Fast Queries

```sql
-- Indexes for common queries
CREATE INDEX idx_answers_room_question ON answers(room_id, question_id);
CREATE INDEX idx_answers_user ON answers(user_id);
CREATE INDEX idx_questions_category_difficulty ON questions(category, difficulty);
CREATE INDEX idx_game_rooms_users ON game_rooms(created_by, partner_id);
CREATE INDEX idx_compatibility_room_category ON compatibility_scores(room_id, category);
```

### 2. Query Optimization

```typescript
// ✅ GOOD: Select only needed columns
const { data } = await supabase
  .from('answers')
  .select('id, answer_value, answered_at') // Only needed fields
  .eq('room_id', roomId)

// ❌ BAD: Select all columns
const { data } = await supabase
  .from('answers')
  .select('*') // All fields (slower)
  .eq('room_id', roomId)
```

### 3. Batch Operations

```typescript
// ✅ GOOD: Batch insert multiple answers
const { data } = await supabase
  .from('answers')
  .insert([
    { room_id, question_id: q1, user_id, answer_value: a1 },
    { room_id, question_id: q2, user_id, answer_value: a2 },
    { room_id, question_id: q3, user_id, answer_value: a3 }
  ])

// ❌ BAD: Multiple separate inserts
await supabase.from('answers').insert({ ...answer1 })
await supabase.from('answers').insert({ ...answer2 })
await supabase.from('answers').insert({ ...answer3 })
```

---

## 💰 Cost Comparison

### Direct Client-to-DB (Supabase)

| Operation | Cost |
|-----------|------|
| **Read queries** | Free (unlimited on free tier) |
| **Write queries** | Free (unlimited on free tier) |
| **Real-time subscriptions** | Free (unlimited on free tier) |
| **Bandwidth** | 2GB/month free, then $25/mo Pro |
| **Storage** | 2GB free, then $25/mo Pro |

**Total**: $0/month (MVP), $25/month (at scale)

### Traditional API Pattern

| Operation | Cost |
|-----------|------|
| **API hosting** | $5-20/month (Railway/Render/Vercel) |
| **Database** | $25/month (Supabase Pro) |
| **Bandwidth** | Included in API hosting |
| **Total** | **$30-45/month** |

**Savings**: $30-45/month with direct client-to-DB pattern ✅

---

## 🎯 Architecture Decision Tree

### When to Use Direct Client Query?

✅ **Use Direct Query When**:
- Simple CRUD operations
- User-centric data (profiles, answers, rooms)
- Real-time subscriptions
- Data filtering/sorting
- RLS policies can secure it

### When to Use Cloudflare Function?

✅ **Use Function When**:
- Complex calculations (compatibility scoring)
- External API calls (third-party integrations)
- Payment processing
- Admin operations
- Heavy data processing

---

## 📝 Implementation Checklist

### Phase 1: Setup
- [ ] Create Supabase project
- [ ] Set up database schema
- [ ] Configure RLS policies
- [ ] Create indexes for performance
- [ ] Set up authentication (Google OAuth + Email)

### Phase 2: Direct Queries
- [ ] Implement profile queries
- [ ] Implement game room queries
- [ ] Implement question queries
- [ ] Implement answer queries
- [ ] Implement score queries

### Phase 3: Real-time
- [ ] Set up real-time subscriptions for game rooms
- [ ] Set up real-time subscriptions for answers
- [ ] Handle connection/disconnection

### Phase 4: Functions (Minimal)
- [ ] Create compatibility score calculation function
- [ ] Set up error handling

---

## 🏆 Final Recommendation

### **Supabase + Astro + Cloudflare Pages**

**Why**:
1. ✅ **Direct client-to-DB** - No API needed for 90% of operations
2. ✅ **RLS security** - Database-level security, no middleware
3. ✅ **Real-time built-in** - Perfect for game sessions
4. ✅ **Low cost** - $0/month MVP, $25/month at scale
5. ✅ **Fast** - PostgreSQL is fast, queries optimized
6. ✅ **Auto-scaling** - Handles traffic automatically

**Architecture**:
```
Client (Astro) 
  ↓ (Direct queries)
Supabase (PostgREST + PostgreSQL)
  ↓ (RLS policies enforce security)
Database
```

**Only use Cloudflare Functions for**:
- Complex compatibility calculations
- External API integrations
- Admin operations

---

## Questions?

Would you like me to:
1. Create the complete database schema with migrations?
2. Show example Astro components using direct queries?
3. Set up the RLS policies?
4. Create the compatibility scoring function?
