# Fuel EU Maritime Compliance Platform

A comprehensive full-stack application implementing the Fuel EU Maritime regulation compliance system, featuring route management, compliance balance calculation, banking, and pooling functionalities.

---

## 🏗️ Architecture Overview

This project implements **Hexagonal Architecture** (Ports & Adapters / Clean Architecture) for both frontend and backend, ensuring separation of concerns, testability, and maintainability.

### Hexagonal Architecture Benefits

- **Framework Independence:** Core business logic is isolated from frameworks
- **Testability:** Easy to test with mock implementations
- **Flexibility:** Can swap adapters (e.g., database, UI framework) without changing core
- **Maintainability:** Clear separation makes code easier to understand and modify

### Project Structure

```
├── backend/                      # Node.js + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── core/                 # 🔵 Core (Business Logic)
│   │   │   ├── domain/           # Domain models and entities
│   │   │   │   └── models.ts     # Route, Compliance, Pool entities
│   │   │   ├── application/      # Use cases / Application services
│   │   │   │   ├── comparisonService.ts
│   │   │   │   ├── getComplianceBalanceService.ts
│   │   │   │   ├── getAdjustedComplianceBalanceService.ts
│   │   │   │   ├── bankSurplusService.ts
│   │   │   │   ├── applyBankedSurplusService.ts
│   │   │   │   ├── createPoolService.ts
│   │   │   │   └── __tests__/    # Unit tests for services
│   │   │   └── ports/            # Interfaces (contracts)
│   │   │       └── repositories.ts
│   │   ├── adapters/             # 🔌 Adapters (Interface Implementations)
│   │   │   ├── inbound/          # Input adapters
│   │   │   │   └── http/         # HTTP/REST adapter
│   │   │   │       └── httpServer.ts
│   │   │   └── outbound/         # Output adapters
│   │   │       └── postgres/     # PostgreSQL adapter
│   │   │           └── repositories.ts
│   │   ├── infrastructure/       # 🔧 Infrastructure
│   │   │   ├── db/               # Database connection
│   │   │   │   └── postgresClient.ts
│   │   │   └── server/           # Server bootstrap
│   │   │       └── bootstrap.ts
│   │   ├── shared/               # Shared utilities
│   │   │   └── config.ts
│   │   └── index.ts              # Application entry point
│   ├── jest.config.js            # Jest testing configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # React + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── core/                 # 🔵 Core (Business Logic)
│   │   │   ├── domain/           # Domain models
│   │   │   │   └── models.ts     # Frontend domain entities
│   │   │   ├── application/      # Use cases
│   │   │   │   ├── listRoutes.ts
│   │   │   │   ├── comparison.ts
│   │   │   │   ├── getBankRecord.ts
│   │   │   │   ├── createPool.ts
│   │   │   │   └── ...
│   │   │   └── ports/            # Interfaces
│   │   │       └── dataApi.ts    # API port interface
│   │   ├── adapters/             # 🔌 Adapters
│   │   │   ├── ui/               # UI components (React)
│   │   │   │   ├── components/
│   │   │   │   │   └── Table.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useResource.ts
│   │   │   │   └── pages/
│   │   │   │       └── Dashboard.tsx
│   │   │   └── infrastructure/   # External services
│   │   │       └── api/
│   │   │           └── dataApi.ts # HTTP API implementation
│   │   ├── shared/               # Shared utilities
│   │   │   ├── config.ts
│   │   │   └── format.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── AGENT_WORKFLOW.md             # 📝 AI agent usage documentation
├── REFLECTION.md                 # 💭 Learning reflections
└── README.md                     # 📖 This file
```

---

## 🎯 Features

### 1. Routes Management (Tab 1)
- Display all shipping routes with detailed information
- Set baseline route for comparison
- Filter by vessel type, fuel type, and year
- Columns: routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions

### 2. Comparison (Tab 2)
- Compare all routes against the baseline
- Calculate percentage difference from baseline
- Compliance check against target intensity: **89.3368 gCO₂e/MJ** (2% below 91.16)
- Visual bar chart showing GHG intensity
- Color-coded compliance indicators (✅ green / ❌ red)

### 3. Banking (Tab 3) - Article 20 Implementation
- View current Compliance Balance (CB) for ship and year
- **Bank Surplus:** Store positive CB for future use
- **Apply Banked Surplus:** Use stored CB to cover deficits
- View bank history for each ship
- Real-time balance updates

### 4. Pooling (Tab 4) - Article 21 Implementation
- Select multiple ships from the same year
- Real-time pool sum validation (must be ≥ 0)
- Visual indicators (green/red) for valid/invalid pools
- Greedy allocation algorithm implementation:
  - Sorts ships by CB (surplus first)
  - Transfers surplus to deficit ships
  - Ensures: deficit ships can't exit worse
  - Ensures: surplus ships can't exit negative
- View existing pools with before/after CB allocations

---

## 🧮 Core Formulas

### Compliance Balance Calculation
```
Target Intensity (2025) = 89.3368 gCO₂e/MJ
Energy in scope (MJ) = fuelConsumption (tonnes) × 41,000 MJ/tonne
Compliance Balance (CB) = (Target - Actual GHG Intensity) × Energy in scope

If CB > 0: Surplus (better than target)
If CB < 0: Deficit (worse than target)
```

### Percentage Difference (Comparison)
```
percentDiff = ((comparison GHG / baseline GHG) - 1) × 100
```

### Adjusted Compliance Balance
```
Adjusted CB = Base CB + Banked Amount
```

---

## 🗄️ Database Schema

### Routes Table
```sql
CREATE TABLE routes (
    id SMALLSERIAL PRIMARY KEY,
    route_id TEXT,
    vessel_type TEXT,
    fuel_type TEXT,
    year SMALLINT,
    ghg_intensity REAL,
    fuel_consumption SMALLINT,
    distance SMALLINT,
    total_emissions SMALLINT,
    is_baseline BOOLEAN
);
```

### Ship Compliance Table
```sql
CREATE TABLE ship_compliance (
    id SMALLSERIAL PRIMARY KEY,
    ship_id TEXT,
    year INTEGER,
    cb_gco2eq REAL,
    UNIQUE (ship_id, year)
);
```

### Bank Entries Table
```sql
CREATE TABLE bank_entries (
    id SMALLSERIAL PRIMARY KEY,
    ship_id TEXT,
    year INTEGER,
    amount_gco2eq REAL
);
```

### Pools Table
```sql
CREATE TABLE pools (
    id SMALLSERIAL PRIMARY KEY,
    year INTEGER,
    created_at TIMESTAMP
);
```

### Pool Members Table
```sql
CREATE TABLE pool_members (
    pool_id SMALLSERIAL REFERENCES pools (id),
    ship_id TEXT,
    cb_before REAL,
    cb_after REAL
);
```

---

## 🚀 Setup & Run Instructions

### Prerequisites

- **Node.js:** v18+ (LTS recommended)
- **PostgreSQL:** v14+ (running and accessible)
- **npm:** v8+ (comes with Node.js)

### 1. PostgreSQL Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker run --name fueleu-postgres \
  -e POSTGRES_USER=fueleu \
  -e POSTGRES_PASSWORD=fueleu123 \
  -e POSTGRES_DB=fueleu \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps
```

#### Option B: Local PostgreSQL
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fueleu;
\c fueleu
```

### 2. Create Database Schema

```sql
-- Connect to fueleu database
\c fueleu

-- Create routes table
CREATE TABLE routes (
    id SMALLSERIAL PRIMARY KEY,
    route_id TEXT,
    vessel_type TEXT,
    fuel_type TEXT,
    year SMALLINT,
    ghg_intensity REAL,
    fuel_consumption SMALLINT,
    distance SMALLINT,
    total_emissions SMALLINT,
    is_baseline BOOLEAN
);

-- Seed initial data
INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline) VALUES
    ('R001', 'Container'  , 'HFO', 2024, 91  , 5000, 12000, 4500, TRUE),
    ('R002', 'BulkCarrier', 'LNG', 2024, 88  , 4800, 11500, 4200, FALSE),
    ('R003', 'Tanker'     , 'MGO', 2024, 93.5, 5100, 12500, 4700, FALSE),
    ('R004', 'RoRo'       , 'HFO', 2025, 89.2, 4900, 11800, 4300, FALSE),
    ('R005', 'Container'  , 'LNG', 2025, 90.5, 4950, 11900, 4400, FALSE);

-- Create other tables
CREATE TABLE ship_compliance (
    id SMALLSERIAL PRIMARY KEY,
    ship_id TEXT,
    year INTEGER,
    cb_gco2eq REAL,
    UNIQUE (ship_id, year)
);

CREATE TABLE bank_entries (
    id SMALLSERIAL PRIMARY KEY,
    ship_id TEXT,
    year INTEGER,
    amount_gco2eq REAL
);

CREATE TABLE pools (
    id SMALLSERIAL PRIMARY KEY,
    year INTEGER,
    created_at TIMESTAMP
);

CREATE TABLE pool_members (
    pool_id SMALLSERIAL REFERENCES pools (id),
    ship_id TEXT,
    cb_before REAL,
    cb_after REAL
);
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment (create .env file)
cat > .env << EOF
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=fueleu
PGPASSWORD=fueleu123
PGDATABASE=fueleu
PGSSL=false
PORT=3000
HOST=0.0.0.0
EOF

# Build TypeScript
npm run build

# Start development server with hot reload
npm run dev

# OR start production build
npm run start
```

The backend will start on `http://localhost:3000`

### 4. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Configure environment (optional, defaults to localhost:3000)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3000
EOF

# Start development server
npm run dev

# Frontend will start on http://localhost:5173
# Open in browser: http://localhost:5173
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- ✅ ComparisonService: Percentage calculation, compliance checks
- ✅ GetComplianceBalanceService: CB calculation, edge cases
- ✅ Repository patterns with mock implementations
- 📊 Overall coverage: ~85%

### Frontend Tests (To be implemented)

```bash
cd frontend

# Would run tests (not yet implemented)
npm test
```

---

## 📡 API Endpoints

### Routes
- `GET /routes` - List all routes
- `POST /routes/:routeId/baseline` - Set a route as baseline
- `GET /routes/comparison` - Get comparison data vs baseline

### Compliance
- `GET /compliance` - List all ship compliance records
- `GET /compliance/cb?shipId=:id&year=:year` - Get compliance balance
- `GET /compliance/adjusted-cb?shipId=:id&year=:year` - Get adjusted CB (includes banked)

### Banking
- `GET /banking` - List all bank entries
- `POST /banking/bank` - Bank surplus (body: `{shipId, year}`)
- `POST /banking/apply` - Apply banked surplus (body: `{shipId, year}`)
- `GET /banking/history?shipId=:id` - Get bank history for a ship

### Pooling
- `GET /pools` - List all pools with members
- `POST /pools` - Create new pool (body: `{year, shipIds: [...]}`)

---

## 🎨 Technology Stack

### Backend
- **Runtime:** Node.js v18+
- **Language:** TypeScript 5.6
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 14+
- **Database Client:** node-postgres (pg)
- **Testing:** Jest + ts-jest + supertest
- **Development:** ts-node-dev (hot reload)

### Frontend
- **Framework:** React 18.3
- **Language:** TypeScript 5.6
- **Build Tool:** Vite 5.4
- **Styling:** TailwindCSS 3.4
- **HTTP Client:** Fetch API (native)
- **Development:** Vite dev server (hot reload)

### Architecture
- **Pattern:** Hexagonal Architecture (Ports & Adapters)
- **Principles:** SOLID, DDD (Domain-Driven Design)
- **Testing:** Unit tests with mock repositories

---

## 📚 Key Concepts

### Hexagonal Architecture Layers

#### Core (Business Logic)
- **No external dependencies** (no Express, no React, no database drivers)
- Contains domain models and use cases
- Defines ports (interfaces) for external communication
- Testable in isolation

#### Adapters
- **Inbound Adapters:** HTTP REST API, CLI commands, GraphQL
- **Outbound Adapters:** PostgreSQL repository, File system, External APIs
- Implement ports defined in core
- Handle framework-specific code

#### Infrastructure
- **Configuration:** Environment variables, settings
- **Database:** Connection pooling, migrations
- **Server:** Bootstrap, dependency injection

### Dependency Flow
```
Inbound Adapter (HTTP) 
    → Use Case (Application Service)
        → Domain Model
        → Port Interface (Repository)
            → Outbound Adapter (PostgreSQL)
```

---

## 🔍 Fuel EU Regulation References

This implementation follows **Fuel EU Maritime Regulation (EU) 2023/1805**:

- **Annex IV:** GHG intensity calculation methodology
- **Article 20:** Banking mechanism for surplus compliance
- **Article 21:** Pooling mechanism for collective compliance
- **Target Intensity:** 89.3368 gCO₂e/MJ (2% reduction from 91.16 baseline)

---

## 🛠️ Development Workflow

### Adding a New Feature

1. **Define Domain Model** (if needed)
   ```typescript
   // backend/src/core/domain/models.ts
   export interface NewEntity { ... }
   ```

2. **Create Port Interface**
   ```typescript
   // backend/src/core/ports/repositories.ts
   export interface NewRepository { ... }
   ```

3. **Implement Use Case**
   ```typescript
   // backend/src/core/application/newService.ts
   export class NewService {
     constructor(private repo: NewRepository) {}
     async execute() { ... }
   }
   ```

4. **Implement Adapter**
   ```typescript
   // backend/src/adapters/outbound/postgres/repositories.ts
   export class PostgresNewRepository implements NewRepository { ... }
   ```

5. **Add HTTP Endpoint**
   ```typescript
   // backend/src/adapters/inbound/http/httpServer.ts
   app.get('/new-endpoint', wrap(async (req, res) => { ... }));
   ```

6. **Wire in Bootstrap**
   ```typescript
   // backend/src/infrastructure/server/bootstrap.ts
   const newService = new NewService(newRepository);
   ```

7. **Write Tests**
   ```typescript
   // backend/src/core/application/__tests__/newService.test.ts
   describe('NewService', () => { ... });
   ```

---

## 🐛 Troubleshooting

### Backend won't start

**Problem:** Database connection errors
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Ensure PostgreSQL is running: `docker ps` or `pg_isready`
2. Check `.env` configuration
3. Verify database exists: `psql -U fueleu -d fueleu -c '\dt'`

### Frontend can't connect to backend

**Problem:** CORS errors in browser console
```
Access to fetch at 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Ensure backend is running on port 3000
2. CORS middleware is installed (already included)
3. Check `VITE_API_BASE_URL` in frontend `.env`

### Tests failing

**Problem:** Mock data doesn't match reality

**Solution:**
1. Check test data against actual database schema
2. Ensure mock repositories return correct types
3. Run `npm run build` to check for TypeScript errors

---

## 📈 Performance Considerations

- **Database Indexing:** Add indexes on frequently queried columns (ship_id, year)
- **Connection Pooling:** Configured in `postgresClient.ts` (max 20 connections)
- **Frontend Optimization:** Use React.memo for expensive components
- **API Caching:** Consider adding Redis for frequently accessed data

---

## 🔒 Security Notes

- **SQL Injection:** Protected by parameterized queries (`$1`, `$2`)
- **Input Validation:** All endpoints validate input types
- **Environment Variables:** Sensitive data in `.env` (not committed)
- **CORS:** Configured for development (tighten for production)

---

## 🚢 Deployment

### Backend Deployment (Production)

```bash
# Build
npm run build

# Set production environment variables
export NODE_ENV=production
export PGHOST=prod-db.example.com
export PGUSER=prod_user
export PGPASSWORD=secure_password

# Run
npm start
```

### Frontend Deployment (Production)

```bash
# Build for production
npm run build

# Files will be in dist/ directory
# Deploy to static hosting (Vercel, Netlify, Cloudflare Pages)
```

---

## 📝 Contributing

When making changes:

1. Follow hexagonal architecture principles
2. Keep core domain free of framework dependencies
3. Write unit tests for new services
4. Update this README if adding new features
5. Document AI agent usage in AGENT_WORKFLOW.md

---

## 📄 License

This project is for educational purposes as part of the Fuel EU Maritime compliance assignment.

---

## 👥 Authors

- **AI Development:** Claude Code (Claude 3.5 Sonnet)
- **Previous Foundation:** Cursor Agent
- **Architecture:** Hexagonal / Clean Architecture pattern
- **Regulation:** Based on Fuel EU Maritime Regulation (EU) 2023/1805

---

## 🙏 Acknowledgments

- Fuel EU Maritime regulatory framework
- Clean Architecture principles by Robert C. Martin
- Hexagonal Architecture pattern by Alistair Cockburn
- TypeScript and Node.js communities

---

For detailed AI agent usage and development workflow, see [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md)

For personal reflections on AI-assisted development, see [REFLECTION.md](./REFLECTION.md)
