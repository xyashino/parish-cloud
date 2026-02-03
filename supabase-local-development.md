# Supabase Local Development & Testing
## Much Simpler Than Firebase!

---

## 🎯 Overview

**Supabase Local Development** is **simpler** than Firebase because:
- ✅ **Single Docker command** - Everything runs in Docker
- ✅ **Real PostgreSQL** - Not an emulator, actual Postgres
- ✅ **No complex config** - Works out of the box
- ✅ **Migration-based** - Database changes via migrations
- ✅ **TypeScript types** - Auto-generated from schema

---

## 🚀 Quick Start (Supabase vs Firebase)

### Firebase Setup (Complex)
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize project
firebase init
# Select: Firestore, Auth, Emulators, Functions, etc.

# 4. Configure firebase.json
# Edit multiple config files

# 5. Start emulators
firebase emulators:start

# 6. Configure client to connect to emulators
# Need conditional logic in code
```

### Supabase Setup (Simple!)
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Initialize project
supabase init

# 3. Start everything (one command!)
supabase start

# Done! Everything is running locally
```

**That's it!** 🎉

---

## 📦 What Gets Started

### Supabase Local Stack

When you run `supabase start`, you get:

| Service | Port | What It Is |
|---------|------|------------|
| **PostgreSQL** | 54322 | Real Postgres database |
| **PostgREST API** | 54321 | Auto-generated REST API |
| **GoTrue (Auth)** | 54324 | Authentication service |
| **Storage** | 54325 | File storage |
| **Realtime** | 54326 | WebSocket server |
| **Studio UI** | 54323 | Database admin UI |
| **Kong API Gateway** | 54327 | API gateway |

**All in Docker containers** - No manual configuration needed!

---

## 💻 Client Configuration

### Firebase (Complex)

```typescript
// lib/firebase.ts - Complex conditional logic
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... more config
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Complex conditional logic
if (import.meta.env.DEV) {
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectAuthEmulator(auth, 'http://localhost:9099')
  }
}

export { app, db, auth }
```

### Supabase (Simple!)

```typescript
// lib/supabase.ts - Just works!
import { createClient } from '@supabase/supabase-js'

// Supabase automatically detects local vs cloud based on URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-local-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// That's it! Works for both local and cloud
```

**Even Simpler** - Use environment variables:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Supabase CLI automatically sets these for local dev!
```

---

## 🎨 Database Management

### Firebase (Complex)

```bash
# Need to manually manage data
# Export/import via CLI
firebase emulators:export ./data
firebase emulators:start --import=./data

# Or use Admin SDK to seed
# Complex setup required
```

### Supabase (Simple!)

```bash
# Migrations are built-in!
supabase migration new create_game_rooms
# Edit the SQL file
supabase db reset  # Applies all migrations

# Or use Studio UI (web interface)
# Just open http://localhost:54323
# Click "Table Editor" and add data visually!
```

**Migration Example**:

```sql
-- supabase/migrations/20240101000000_create_game_rooms.sql
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
  partner_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- That's it! Run `supabase db reset` to apply
```

---

## 🧪 Testing Setup

### Firebase (Complex)

```typescript
// tests/setup.ts - Need to configure emulators
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const app = initializeApp({
  apiKey: "test-key",
  projectId: "test-project"
})

const db = getFirestore(app)
const auth = getAuth(app)

connectFirestoreEmulator(db, 'localhost', 8080)
connectAuthEmulator(auth, 'http://localhost:9099')

export { db, auth }
```

### Supabase (Simple!)

```typescript
// tests/setup.ts - Just use the same client!
import { createClient } from '@supabase/supabase-js'

// Supabase automatically uses local instance if running
export const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

// Or even simpler - use test helper
import { createClient } from '@supabase/supabase-js'

export const testSupabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || 'test-key'
)
```

**Test Example**:

```typescript
// tests/game-room.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { supabase } from './setup'

describe('Game Room', () => {
  beforeAll(async () => {
    // Reset database before tests
    await supabase.rpc('reset_database') // Or use migrations
  })

  it('should create a game room', async () => {
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        created_by: 'user-id',
        status: 'waiting'
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.id).toBeDefined()
  })
})
```

---

## 🔄 Data Seeding

### Firebase (Complex)

```typescript
// scripts/seed-firebase.ts - Need Admin SDK
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app = initializeApp({
  credential: cert({
    projectId: 'test-project',
    // ... complex credentials
  })
})

const db = getFirestore(app)

async function seed() {
  await db.collection('questions').add({
    category: 'relationship_dynamics',
    question_text: 'How often do you spend time together?'
  })
  // ... more complex setup
}
```

### Supabase (Simple!)

**Option 1: SQL Seed File**

```sql
-- supabase/seed.sql
INSERT INTO questions (category, difficulty, question_text, question_type) VALUES
  ('relationship_dynamics', 'easy', 'How often do you spend time together?', 'multiple_choice'),
  ('relationship_dynamics', 'medium', 'How do you handle conflicts?', 'open_text'),
  -- ... more questions
;

-- Run: supabase db reset (applies migrations + seed.sql)
```

**Option 2: TypeScript Seed Script**

```typescript
// scripts/seed.ts - Use regular Supabase client!
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:54321',
  'your-local-anon-key'
)

async function seed() {
  const { error } = await supabase
    .from('questions')
    .insert([
      {
        category: 'relationship_dynamics',
        difficulty: 'easy',
        question_text: 'How often do you spend time together?',
        question_type: 'multiple_choice'
      },
      // ... more questions
    ])

  if (error) console.error('Seed error:', error)
  else console.log('✅ Seeded questions')
}

seed()
```

**Run**:
```bash
# Start Supabase
supabase start

# Run seed script
npm run seed
```

---

## 🎯 Complete Comparison

### Setup Complexity

| Task | Firebase | Supabase |
|------|----------|----------|
| **Initial Setup** | 5+ steps, multiple configs | 2 commands |
| **Client Config** | Conditional logic needed | Works automatically |
| **Database Setup** | Manual via Admin SDK | Migrations (SQL files) |
| **Data Seeding** | Complex Admin SDK | Simple SQL or client |
| **Testing** | Emulator config needed | Same client, just different URL |
| **UI Access** | http://localhost:4000 | http://localhost:54323 |

### Code Complexity

**Firebase**:
```typescript
// Complex conditional logic
const app = initializeApp(config)
const db = getFirestore(app)
const auth = getAuth(app)

if (isDev && useEmulators) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}

// Different clients for admin operations
import { initializeApp, cert } from 'firebase-admin/app'
const adminApp = initializeApp({ credential: cert(...) })
```

**Supabase**:
```typescript
// Same client everywhere!
const supabase = createClient(url, key)

// Works for local, cloud, and tests
// No conditional logic needed
```

---

## 🚀 Complete Setup Example

### 1. Initialize Project

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize (creates supabase/ folder)
supabase init

# Start everything
supabase start
```

**Output**:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Create Migration

```bash
# Create new migration
supabase migration new create_game_rooms
```

**File**: `supabase/migrations/20240101000000_create_game_rooms.sql`

```sql
-- Create game_rooms table
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
  partner_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'waiting',
  current_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view rooms they're in"
  ON game_rooms FOR SELECT
  USING (
    auth.uid() = created_by OR 
    auth.uid() = partner_id
  );
```

### 3. Apply Migration

```bash
# Reset database (applies all migrations)
supabase db reset

# Or apply specific migration
supabase migration up
```

### 4. Use in Code

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-local-key'
)

// Use everywhere - works for local and cloud!
```

### 5. Access Studio UI

Open http://localhost:54323

**Features**:
- ✅ **Table Editor** - Visual database editing
- ✅ **SQL Editor** - Run SQL queries
- ✅ **Auth** - Manage users
- ✅ **Storage** - File management
- ✅ **API Docs** - Auto-generated API docs
- ✅ **Logs** - View request logs

---

## 🧪 Testing Setup

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'node'
  }
})
```

### Test Setup

```typescript
// tests/setup.ts
import { createClient } from '@supabase/supabase-js'
import { beforeAll, afterEach } from 'vitest'

// Use local Supabase instance
export const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

beforeAll(async () => {
  // Reset database before all tests
  await supabase.rpc('exec_sql', {
    sql: 'TRUNCATE TABLE game_rooms, answers, questions CASCADE;'
  })
})

afterEach(async () => {
  // Clean up after each test
  await supabase.from('game_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
})
```

### Test Example

```typescript
// tests/game-room.test.ts
import { describe, it, expect } from 'vitest'
import { supabase } from './setup'

describe('Game Room', () => {
  it('should create a game room', async () => {
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        created_by: 'user-123',
        status: 'waiting'
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.id).toBeDefined()
    expect(data.status).toBe('waiting')
  })

  it('should query game rooms', async () => {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('created_by', 'user-123')

    expect(error).toBeNull()
    expect(data).toBeInstanceOf(Array)
  })
})
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: supabase/postgres:latest
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Supabase CLI
        run: npm install -g supabase
      
      - name: Start Supabase
        run: supabase start
        env:
          SUPABASE_DB_PASSWORD: postgres
      
      - name: Run tests
        run: npm test
        env:
          VITE_SUPABASE_URL: http://localhost:54321
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

**Much simpler than Firebase!** No emulator configuration needed.

---

## 📊 Side-by-Side Comparison

### Development Workflow

| Task | Firebase | Supabase |
|------|----------|----------|
| **Start Local** | `firebase emulators:start` | `supabase start` |
| **Create Schema** | Manual via Admin SDK | `supabase migration new` |
| **Apply Changes** | Manual or scripts | `supabase db reset` |
| **View Data** | Emulator UI (limited) | Studio UI (full-featured) |
| **Seed Data** | Complex Admin SDK | Simple SQL file |
| **Test Setup** | Emulator config | Same client, different URL |
| **Stop** | Ctrl+C | `supabase stop` |

### Code Complexity

**Firebase** (Complex):
```typescript
// Need different clients for different purposes
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { initializeApp as adminInit, cert } from 'firebase-admin/app'

// Client SDK
const app = initializeApp(config)
const db = getFirestore(app)
if (isDev) connectFirestoreEmulator(db, 'localhost', 8080)

// Admin SDK (for seeding/testing)
const adminApp = adminInit({ credential: cert(...) })
const adminDb = getFirestore(adminApp)
```

**Supabase** (Simple):
```typescript
// Same client everywhere!
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Works for:
// - Local development
// - Production
// - Testing
// - Seeding
// - Everything!
```

---

## 🎯 Key Advantages of Supabase

### 1. **Real PostgreSQL**
- Not an emulator - actual Postgres
- Same database locally and in production
- No surprises when deploying

### 2. **Migration-Based**
- Version control for database changes
- Easy to rollback
- Team collaboration via Git

### 3. **Studio UI**
- Full-featured database admin
- Visual table editor
- SQL editor with autocomplete
- API documentation
- Auth management

### 4. **TypeScript Types**
```bash
# Generate types from database
supabase gen types typescript --local > types/database.ts
```

```typescript
// Auto-generated types!
import { Database } from './types/database'

type GameRoom = Database['public']['Tables']['game_rooms']['Row']
type NewGameRoom = Database['public']['Tables']['game_rooms']['Insert']
```

### 5. **Same Client Everywhere**
- No conditional logic
- No different SDKs
- Works identically locally and in production

---

## 🚨 Common Issues & Solutions

### Issue: Port Already in Use

```bash
# Stop Supabase
supabase stop

# Or stop specific service
supabase stop --no-backup
```

### Issue: Database Reset

```bash
# Reset database (applies migrations)
supabase db reset

# Reset with seed data
supabase db reset --seed
```

### Issue: View Logs

```bash
# View all logs
supabase logs

# View specific service
supabase logs --service postgres
```

---

## ✅ Summary

### Why Supabase is Simpler

1. ✅ **One Command** - `supabase start` does everything
2. ✅ **Real Database** - Actual Postgres, not emulator
3. ✅ **Same Client** - No conditional logic needed
4. ✅ **Migrations** - Version-controlled database changes
5. ✅ **Studio UI** - Full-featured admin interface
6. ✅ **TypeScript** - Auto-generated types from schema

### Quick Comparison

| Feature | Firebase | Supabase |
|--------|----------|----------|
| **Setup Steps** | 5+ | 2 |
| **Config Files** | Multiple | 1 (supabase/config.toml) |
| **Client Code** | Complex | Simple |
| **Database** | Emulator | Real Postgres |
| **Migrations** | Manual | Built-in |
| **UI** | Basic | Full-featured |

---

## 🎉 Conclusion

**Supabase local development is MUCH simpler than Firebase!**

- ✅ **2 commands** vs 5+ steps
- ✅ **Real Postgres** vs emulator
- ✅ **Same client** vs multiple SDKs
- ✅ **Migrations** vs manual setup
- ✅ **Studio UI** vs basic emulator UI

**Recommendation**: Use Supabase for simpler local development experience!

---

## Questions?

Would you like me to:
1. Create a complete Supabase setup for your game app?
2. Set up testing with Vitest?
3. Create migration files for your schema?
4. Set up CI/CD integration?
