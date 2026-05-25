# SAQR AI Backend

> **The AI Engineering Brain for GCC Infrastructure**

SAQR AI is an enterprise-grade AI operating system for GCC infrastructure fit-out and engineering projects. It provides deterministic rules-based calculations (Lighting, Power, and ELV/Low Current systems) combined with AI-ready document search, digital twin facilities tracking, variation claims assistants, and real-time BOQ compilers.

---

## 🏗️ Technical Stack

- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma with PostgreSQL
- **Calculations**: Deterministic TypeScript engineering rule engines (Lumens-to-Lux calculations, network drop arrays, load kW schedules)
- **Validation**: Zod (type-safe request parsing)
- **Security**: JWT session tokens, bcrypt password hashing, Helmet, CORS
- **Uploads**: Multer local storage metadata mapper

---

## 📁 Repository Structure

```text
saqr-ai-backend/
├── prisma/
│   ├── schema.prisma      # PostgreSQL Database Schema
│   └── seed.ts            # Complete Project Seeding Script
├── src/
│   ├── app.ts             # Express Configuration & Routes Mounting
│   ├── server.ts          # Server Entrypoint
│   ├── config/            # Environment & DB Connections
│   ├── middleware/        # JWT Authentication, Auditing, and Validation
│   ├── modules/           # Module Controllers, Routers, Validations
│   │   ├── auth/          # Register, Login, Profile
│   │   ├── companies/     # Org Info Update
│   │   ├── workspaces/    # Partitioning Workspaces
│   │   ├── projects/      # Core Projects, Calculations, BOQ, Reports, RAG Chat, Site Photos, Claims, Assets
│   │   ├── rooms/         # Room schedules CRUD
│   │   └── templates/     # Engineering template guidelines
│   ├── services/          # Pure Engineering Logic & AI Placeholders
│   │   ├── engineering/   # Lighting, Power, ELV, and BOQ compiles
│   │   ├── ai/            # Mock Ingestion, Embeddings, RAG, Vision, Reports
│   │   └── storage/       # Upload file operations
│   ├── utils/             # Loggers, custom AppErrors, Unified APIs
│   └── types/             # Express global namespace typing extensions
├── uploads/               # Temporary uploads storage directory
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚦 Local Installation & Startup

Follow these steps to run the SAQR AI backend service:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your local PostgreSQL database URL:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is pointing to an active PostgreSQL database:
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saqr_db?schema=public"
```

### 3. Run Database Migrations
Create the database tables and relations:
```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database
Populate the database with the Doha Lusail fit-out project, rooms, and configurations:
```bash
npm run seed
```

### 5. Start the Development Server
```bash
npm run dev
```
The server will boot up at **[http://localhost:5000](http://localhost:5000)**.

---

## 📐 Deterministic Engineering Rules Engine

SAQR AI runs on a dual-track architecture: a deterministic, auditable mathematical rules engine for compliance and math, and an LLM/Vision RAG layer for document search and photo inspections.

### A. Lighting Calculation
Calculated using the utilization factor (UF) method:
$$\text{Fixtures} = \frac{\text{Area} \times \text{Target Lux}}{\text{Fixture Lumens} \times \text{UF} \times \text{MF}}$$
- **Defaults**: Open Office (450 Lux), Server Room (400 Lux), Corridor (120 Lux).
- **Default Fixture**: 60x60 LED Panel (36W, 3200 lumens).

### B. Power Socket Calculations
Estimates socket outlets and high-current circuits:
- **Workstations**: 2 double GFI outlets each.
- **Server Room**: Dedicated dual power loops + A/C feeds + UPS backup requirement.
- **Pantry**: Specialized high-current appliance lines.

### C. Low-Current (ELV) Systems
Positions networking, CCTV, and building management drops:
- **Data outlets**: 2 structural drops per desk.
- **Wi-Fi**: 1 AP per 150 sqm of workspace area.
- **CCTV**: Covers entrances, reception lobbies, and main corridors.

---

## 🔒 Security & Tenant Separation

All critical routes check the active user's `companyId`. A user can only fetch, modify, or run calculations on projects/workspaces that belong to their own company organization. Unauthorized access throws a `ForbiddenError` (HTTP 403).

---

## 🛠️ API Reference & Testing Command List

Use a REST Client (e.g. Postman, Insomnia, or cURL) to verify the endpoints:

### 1. Health Endpoint
```bash
curl -X GET http://localhost:5000/api/health
```

### 2. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@saqr.ai", "password": "Demo123456"}'
```
*Note: Copy the `token` from this response and use it as `Authorization: Bearer <token>` for all subsequent calls.*

### 3. List Mapped Projects
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 4. Fetch Lusail Project Details
```bash
curl -X GET http://localhost:5000/api/projects/<PROJECT_ID> \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 5. Fetch Rooms Schedule List
```bash
curl -X GET http://localhost:5000/api/projects/<PROJECT_ID>/rooms \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 6. Compile Engineering Calculations
Calculates Lighting, Power, and low-current totals for all rooms in the project:
```bash
curl -X POST http://localhost:5000/api/projects/<PROJECT_ID>/generate-design \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 7. Compile BOQ Items
```bash
curl -X POST http://localhost:5000/api/projects/<PROJECT_ID>/generate-boq \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 8. Fetch Project BOQ List
```bash
curl -X GET http://localhost:5000/api/projects/<PROJECT_ID>/boq \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 9. Generate AI Concept Report
```bash
curl -X POST http://localhost:5000/api/projects/<PROJECT_ID>/generate-report \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 10. AI Project RAG Chat
```bash
curl -X POST http://localhost:5000/api/projects/<PROJECT_ID>/chat \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"question": "How many lighting fixtures are required in the open office?"}'
```

### 11. Fetch Handover Digital Twin Assets
```bash
curl -X GET http://localhost:5000/api/projects/<PROJECT_ID>/assets \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## ⚠️ Safety Disclaimer
SAQR AI automates design estimations based on engineer-configurable templates. All calculations, engineering reports, and BOQs generated by the platform must be reviewed, stamped, and approved by qualified local MEP consultants before construction or procurement.
