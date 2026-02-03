# Firebase Local Development & Testing
## Firebase Emulator Suite Guide

---

## 🎯 Overview

**Firebase Emulator Suite** allows you to run Firebase services **locally** without connecting to the cloud. Perfect for:
- ✅ **Testing** - Unit tests, integration tests
- ✅ **Development** - Offline development, no cloud costs
- ✅ **CI/CD** - Automated testing in pipelines
- ✅ **Data seeding** - Populate test data easily
- ✅ **Debugging** - Inspect data, test security rules

---

## 🚀 Firebase Emulator Suite

### What's Included

| Service | Emulator | Use Case |
|---------|----------|----------|
| **Firestore** | ✅ Yes | Local database |
| **Realtime Database** | ✅ Yes | Local real-time DB |
| **Authentication** | ✅ Yes | Local auth |
| **Cloud Functions** | ✅ Yes | Local functions |
| **Cloud Storage** | ✅ Yes | Local file storage |
| **Pub/Sub** | ✅ Yes | Local messaging |
| **Extensions** | ✅ Yes | Local extensions |

### Installation

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select emulators you want
# - Firestore
# - Authentication
# - Cloud Functions
# - etc.
```

---

## 📦 Setup for Your Project

### 1. Initialize Firebase Project

```bash
cd your-project
firebase init
```

**Select**:
- ✅ Firestore
- ✅ Authentication
- ✅ Emulators

### 2. Firebase Configuration

**`firebase.json`**:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

### 3. Start Emulators

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only firestore,auth

# Start with UI
firebase emulators:start --ui
```

**Access**:
- **Emulator UI**: http://localhost:4000
- **Firestore**: localhost:8080
- **Auth**: localhost:9099

---

## 💻 Client Configuration

### Connect to Local Emulators

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "demo-api-key",
  projectId: "demo-project",
  // ... other config
}

const app = initializeApp(firebaseConfig)

// Connect to emulators in development
if (import.meta.env.DEV) {
  const db = getFirestore(app)
  const auth = getAuth(app)
  
  // Connect to local emulators
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}

export { app, db, auth }
```

### Environment-Based Configuration

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const isDevelopment = import.meta.env.DEV
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

const firebaseConfig = isDevelopment && useEmulators
  ? {
      // Emulator config (no real credentials needed)
      apiKey: "demo-api-key",
      authDomain: "localhost",
      projectId: "demo-project",
      storageBucket: "demo-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "demo-app-id"
    }
  : {
      // Production config
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      // ... other production config
    }

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Connect to emulators only in development
if (isDevelopment && useEmulators) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}

export { app, db, auth }
```

**`.env.local`**:
```bash
# Use emulators in development
VITE_USE_EMULATORS=true
```

---

## 🧪 Testing Setup

### Jest/Vitest Configuration

```typescript
// tests/setup.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

// Initialize Firebase with emulator config
const app = initializeApp({
  apiKey: "test-api-key",
  projectId: "test-project",
})

const db = getFirestore(app)
const auth = getAuth(app)

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080)
connectAuthEmulator(auth, 'http://localhost:9099')

export { app, db, auth }
```

### Test Example

```typescript
// tests/game-room.test.ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from './setup'

describe('Game Room', () => {
  beforeEach(async () => {
    // Clear Firestore before each test
    // (You'll need a helper function for this)
    await clearFirestore()
  })

  it('should create a game room', async () => {
    const roomData = {
      created_by: 'user1',
      status: 'waiting',
      created_at: new Date()
    }

    const docRef = await addDoc(collection(db, 'game_rooms'), roomData)
    expect(docRef.id).toBeDefined()
  })

  it('should query game rooms by user', async () => {
    // Create test data
    await addDoc(collection(db, 'game_rooms'), {
      created_by: 'user1',
      status: 'waiting'
    })

    // Query
    const q = query(
      collection(db, 'game_rooms'),
      where('created_by', '==', 'user1')
    )
    const snapshot = await getDocs(q)

    expect(snapshot.size).toBe(1)
  })
})
```

### Helper Functions

```typescript
// tests/helpers.ts
import { getFirestore } from 'firebase/firestore'

export async function clearFirestore() {
  // Note: Emulator doesn't have a direct clear function
  // You need to delete collections manually or use admin SDK
  const db = getFirestore()
  // Implementation depends on your needs
}

// Or use Firebase Admin SDK for testing
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app = initializeApp({
  credential: cert({
    projectId: 'test-project',
    // ... emulator credentials
  })
})

const adminDb = getFirestore(app)

export async function clearFirestore() {
  const collections = await adminDb.listCollections()
  for (const collection of collections) {
    const snapshot = await collection.get()
    const batch = adminDb.batch()
    snapshot.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
  }
}
```

---

## 🔄 Data Seeding

### Seed Test Data

```typescript
// scripts/seed-emulator.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { collection, addDoc } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "demo-api-key",
  projectId: "demo-project",
})

const db = getFirestore(app)
connectFirestoreEmulator(db, 'localhost', 8080)

async function seedData() {
  // Seed questions
  const questions = [
    {
      category: 'relationship_dynamics',
      difficulty: 'easy',
      question_text: 'How often do you spend time together?',
      question_type: 'multiple_choice',
      options: ['Daily', '3-4 times', '1-2 times', 'Rarely']
    },
    // ... more questions
  ]

  for (const question of questions) {
    await addDoc(collection(db, 'questions'), question)
  }

  console.log('✅ Seeded questions')

  // Seed game rooms
  const rooms = [
    {
      created_by: 'user1',
      partner_id: 'user2',
      status: 'active',
      current_category: 'relationship_dynamics'
    }
  ]

  for (const room of rooms) {
    await addDoc(collection(db, 'game_rooms'), room)
  }

  console.log('✅ Seeded game rooms')
}

seedData().then(() => {
  console.log('🎉 Seeding complete!')
  process.exit(0)
})
```

**Run**:
```bash
# Start emulators first
firebase emulators:start

# In another terminal, run seed script
npm run seed:emulator
```

---

## 🤖 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
      
      - name: Start Firebase Emulators
        run: firebase emulators:start --detach
      
      - name: Wait for emulators
        run: |
          timeout 30 bash -c 'until curl -f http://localhost:4000; do sleep 1; done'
      
      - name: Run tests
        run: npm test
        env:
          VITE_USE_EMULATORS: 'true'
      
      - name: Stop emulators
        run: firebase emulators:exec --only firestore,auth "echo 'Emulators stopped'"
```

### GitLab CI Example

```yaml
# .gitlab-ci.yml
test:
  image: node:18
  before_script:
    - npm install -g firebase-tools
    - npm ci
  script:
    - firebase emulators:start --detach
    - sleep 10  # Wait for emulators to start
    - npm test
    - firebase emulators:exec --only firestore,auth "echo 'Done'"
  variables:
    VITE_USE_EMULATORS: 'true'
```

---

## 🎨 Emulator UI

### Features

The Emulator UI (http://localhost:4000) provides:
- ✅ **Firestore Data Viewer** - Browse collections/documents
- ✅ **Auth Users** - View/manage authenticated users
- ✅ **Functions Logs** - View function execution logs
- ✅ **Storage Files** - Browse uploaded files
- ✅ **Data Export/Import** - Save/load emulator data

### Export/Import Data

```bash
# Export emulator data
firebase emulators:export ./emulator-data

# Import emulator data
firebase emulators:start --import=./emulator-data

# Auto-export on shutdown
firebase emulators:start --export-on-exit=./emulator-data
```

---

## 🔐 Security Rules Testing

### Test Security Rules Locally

```typescript
// tests/security-rules.test.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth'

const app = initializeApp({
  apiKey: "demo-api-key",
  projectId: "demo-project",
})

const db = getFirestore(app)
const auth = getAuth(app)

connectFirestoreEmulator(db, 'localhost', 8080)
connectAuthEmulator(auth, 'http://localhost:9099')

describe('Security Rules', () => {
  it('should allow authenticated user to read own profile', async () => {
    // Sign in
    const userCredential = await signInAnonymously(auth)
    const userId = userCredential.user.uid

    // Try to read own profile (should succeed)
    const profileRef = doc(db, 'profiles', userId)
    const profile = await getDoc(profileRef)

    expect(profile.exists()).toBe(true)
  })

  it('should deny unauthenticated user from reading profiles', async () => {
    // Don't sign in
    
    // Try to read profile (should fail)
    const profileRef = doc(db, 'profiles', 'user1')
    
    await expect(getDoc(profileRef)).rejects.toThrow()
  })
})
```

---

## 📊 Performance Testing

### Load Testing with Emulators

```typescript
// tests/load.test.ts
import { collection, addDoc } from 'firebase/firestore'
import { db } from './setup'

describe('Load Test', () => {
  it('should handle 1000 concurrent writes', async () => {
    const promises = []
    
    for (let i = 0; i < 1000; i++) {
      promises.push(
        addDoc(collection(db, 'answers'), {
          room_id: 'room1',
          question_id: `q${i}`,
          user_id: 'user1',
          answer_value: `answer${i}`
        })
      )
    }

    const start = Date.now()
    await Promise.all(promises)
    const duration = Date.now() - start

    console.log(`1000 writes completed in ${duration}ms`)
    expect(duration).toBeLessThan(5000) // Should complete in <5s
  })
})
```

---

## 🐛 Debugging

### Inspect Emulator Data

```typescript
// scripts/inspect-data.ts
import { getFirestore, connectFirestoreEmulator, collection, getDocs } from 'firebase/firestore'

const db = getFirestore()
connectFirestoreEmulator(db, 'localhost', 8080)

async function inspectData() {
  // List all collections
  const collections = ['game_rooms', 'answers', 'questions', 'profiles']
  
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName))
    console.log(`\n${collectionName}:`)
    snapshot.docs.forEach(doc => {
      console.log(`  ${doc.id}:`, doc.data())
    })
  }
}

inspectData()
```

### Emulator Logs

```bash
# View emulator logs
firebase emulators:start --debug

# Or check logs in Emulator UI
# http://localhost:4000/logs
```

---

## 🔄 Switching Between Local and Cloud

### Environment-Based Switch

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const useEmulators = 
  import.meta.env.VITE_USE_EMULATORS === 'true' ||
  import.meta.env.MODE === 'test'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... other config
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

if (useEmulators) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
  console.log('🔥 Using Firebase Emulators')
} else {
  console.log('☁️ Using Firebase Cloud')
}

export { app, db, auth }
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "firebase emulators:start & vite",
    "dev:cloud": "vite",
    "test": "firebase emulators:exec --only firestore,auth 'vitest'",
    "test:unit": "vitest",
    "seed": "firebase emulators:exec --only firestore 'tsx scripts/seed-emulator.ts'"
  }
}
```

---

## 🎯 Best Practices

### 1. Always Use Emulators in Tests

```typescript
// tests/setup.ts
// Always connect to emulators in test environment
if (import.meta.env.MODE === 'test') {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}
```

### 2. Clear Data Between Tests

```typescript
// tests/helpers.ts
export async function clearAllData() {
  // Use Admin SDK to clear emulator data
  const adminDb = getFirestore()
  // Clear collections...
}
```

### 3. Use Seed Data for Development

```bash
# Start emulators with seed data
firebase emulators:start --import=./seed-data
```

### 4. Export Data for Sharing

```bash
# Export current emulator state
firebase emulators:export ./emulator-data

# Commit to git (for team sharing)
git add emulator-data
git commit -m "Update emulator seed data"
```

---

## 🚨 Limitations

### What Emulators DON'T Support

- ❌ **Cloud Functions triggers** - Some triggers don't work locally
- ❌ **Extensions** - Limited extension support
- ❌ **Storage rules** - Basic support only
- ❌ **Performance** - Slower than production (but fine for testing)
- ❌ **Scale testing** - Not designed for massive scale tests

### Workarounds

```typescript
// Mock Cloud Functions triggers in tests
jest.mock('firebase-functions', () => ({
  https: {
    onCall: jest.fn(),
    onRequest: jest.fn()
  }
}))
```

---

## 📝 Complete Example Setup

### Project Structure

```
your-project/
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── lib/
│   └── firebase.ts
├── tests/
│   ├── setup.ts
│   ├── game-room.test.ts
│   └── helpers.ts
├── scripts/
│   └── seed-emulator.ts
└── package.json
```

### firebase.json

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### lib/firebase.ts

```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const useEmulators = 
  import.meta.env.VITE_USE_EMULATORS === 'true' ||
  import.meta.env.MODE === 'test'

const firebaseConfig = useEmulators
  ? {
      apiKey: "demo-api-key",
      projectId: "demo-project",
      authDomain: "localhost"
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      // ... production config
    }

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

if (useEmulators) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}

export { app, db, auth }
```

---

## ✅ Summary

### Benefits of Firebase Emulators

1. ✅ **Free** - No cloud costs during development
2. ✅ **Fast** - Local execution, no network latency
3. ✅ **Isolated** - Don't affect production data
4. ✅ **Testable** - Perfect for automated testing
5. ✅ **Debuggable** - Inspect data easily via UI
6. ✅ **Offline** - Work without internet connection

### When to Use

- ✅ **Development** - Always use emulators locally
- ✅ **Testing** - All tests should use emulators
- ✅ **CI/CD** - Run tests against emulators
- ✅ **Data Seeding** - Populate test data easily
- ✅ **Debugging** - Inspect data without cloud access

### Quick Start

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Initialize project
firebase init

# 3. Start emulators
firebase emulators:start

# 4. Access UI
# http://localhost:4000
```

---

## Questions?

Would you like me to:
1. Create a complete test setup for your game app?
2. Set up CI/CD integration?
3. Create seed data scripts?
4. Show security rules testing examples?
