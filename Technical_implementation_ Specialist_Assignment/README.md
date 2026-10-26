# Sunrise Interiors – Project & Workflow Management System

A centralized, full-stack project and workflow management web application built for **Sunrise Interiors**, a six-member boutique interior design studio based in Bengaluru, India.

This project was built as part of the **Technical Implementation Specialist (Intern)** take-home assignment for **Agile Automate**.

---

## 1. Project Scenario & Business Value

### The Challenge
Sunrise Interiors was managing client projects across fragmented WhatsApp groups, tracking vendor bills via disparate Excel spreadsheets, and coordinating design team tasks through manual messages without centralized oversight. This led to:
- Missed handover milestones and delayed project deliveries
- Risk of duplicate vendor invoice payments
- Lack of clear task ownership across the 3 core designers
- Inaccurate and stale project status reporting
- Difficulty identifying projects at risk before deadlines lapse
- No unified executive view of studio cash flow and procurement

### The Solution
The **Sunrise Interiors Project & Workflow Management System** centralizes all studio operations into a unified platform featuring:
1. **Client Project Lifecycle Management**: Comprehensive tracking across 8 lifecycle stages (Consultation &rarr; Completed), with dual **Table** and **Kanban** view modes, budget tracking in INR, and automatic overdue handover detection.
2. **Vendor & Procurement Tracking with Duplicate Protection**: Multi-tier duplicate invoice protection enforced at both the application level and the database level (`UniqueConstraint('vendor_id', 'invoice_number')`). Outstanding balance calculation, payment settlement recording, and overdue invoice flagging.
3. **Design Team Task Management**: Task assignment across designers (Designer 1: Ananya Sharma, Designer 2: Vikram Malhotra, Designer 3: Priya Nair), with priority ratings, status pipelines, due-date sorting, and automated overdue detection.
4. **Lead Ingestion & Conversion**: Capture prospective clients, validate budgets, prevent duplicate submissions, and convert qualified inquiries into projects while preserving the original inquiry history.
5. **Internal Automation Engine**: Live background rules that trigger real-time notifications when project health shifts to *At Risk* or when task deadlines pass without completion.
6. **Python Data Cleaning Pipeline**: Standalone CLI script (`clean_leads.py`) and unit tests (`test_clean_leads.py`) standardizing Indian mobile numbers into `+91XXXXXXXXXX`, removing duplicate rows, and isolating invalid numbers without silent discarding.
7. **Documented n8n Lead Workflow & ClickUp Guide**: Detailed architectural blueprint and interactive simulation runner for Google Forms lead ingestion, ClickUp task synchronization, confirmation emails, and conditional design team alerts.

---

## 2. Technology Stack

- **Frontend**:
  - React 19 + TypeScript
  - Vite 8 (fast HMR and production bundling)
  - Tailwind CSS v4 (design system, responsive layouts)
  - Lucide React (feather-style iconography)
  - React Router v7 (client-side routing)
- **Backend**:
  - Python 3.10+ (tested on Python 3.14)
  - FastAPI (high-performance asynchronous API framework)
  - SQLAlchemy 2.0 (ORM with SQLite database and relational integrity)
  - Pydantic v2 (strict request validation and serialization)
  - Uvicorn (ASGI web server)
- **Database**:
  - SQLite (local development with transactional constraints)
- **Testing**:
  - Pytest (18 automated backend & data-cleaning unit/integration tests)

---

## 3. Directory Structure

```text
Technical_implementation_ Specialist_Assignment/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Pydantic settings & environment configuration
│   │   ├── database.py            # SQLAlchemy engine, session maker, get_db dependency
│   │   ├── models.py              # Project, Lead, Vendor, Invoice, Task, TeamMember, Notification models
│   │   ├── schemas.py             # Request & response Pydantic schemas with validation
│   │   ├── main.py                # FastAPI app initialization, CORS middleware, router registration
│   │   ├── routers/
│   │   │   ├── projects.py        # Project CRUD, filtering, sorting, At Risk automation
│   │   │   ├── leads.py           # Lead management, duplicate checking, conversion
│   │   │   ├── vendors.py         # Vendor directory, invoice duplicate protection, payments
│   │   │   ├── tasks.py           # Task delegation, priority filters, overdue monitoring
│   │   │   ├── team.py            # Design team roster management
│   │   │   ├── notifications.py   # Live notification center & unread counts
│   │   │   ├── automations.py     # Automation rules & manual scan endpoint
│   │   │   ├── dashboard.py       # Live computed metrics & aggregations
│   │   │   └── cleaning.py        # Lead cleaning API endpoint
│   │   └── services/
│   │       ├── automation_service.py # Automation trigger handlers
│   │       └── cleaning_service.py   # Data cleaning logic wrapper
│   └── seed.py                    # Database seed script with realistic Bengaluru studio data
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx         # Sidebar + Navbar shell
│   │   │   ├── Navbar.tsx         # Top bar with live notification center & profile
│   │   │   ├── Sidebar.tsx        # Navigation sidebar with brand header
│   │   │   ├── StatusBadge.tsx    # Color-coded badge for health, status, priority
│   │   │   └── Modal.tsx          # Accessible modal dialog
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Executive overview with 6 summary cards & charts
│   │   │   ├── Projects.tsx       # Table & Kanban view, project CRUD, handover alerts
│   │   │   ├── Leads.tsx          # Inbound leads directory & conversion to project
│   │   │   ├── Tasks.tsx          # Team task board with overdue indicators
│   │   │   ├── Vendors.tsx        # Invoices, duplicate prevention, payment recorder
│   │   │   ├── Team.tsx           # 3 designers roster with workload metrics
│   │   │   ├── AutomationWorkflow.tsx # Documented n8n workflow & live execution simulator
│   │   │   ├── DataCleaning.tsx   # Interactive Python data cleaning workbench
│   │   │   ├── ClickUpGuide.tsx   # Practical ClickUp workspace configuration guide
│   │   │   └── Settings.tsx       # Studio preferences & automation rules toggle
│   │   ├── services/
│   │   │   └── api.ts             # Typed API client with INR currency formatting
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript domain interfaces
│   │   ├── App.tsx                # Client-side router configuration
│   │   ├── index.css              # Tailwind CSS styles & typography
│   │   └── main.tsx               # React application entry point
│   ├── index.html                 # HTML shell with Google Fonts
│   ├── package.json               # Frontend dependencies & build scripts
│   ├── tsconfig.json              # TypeScript configuration
│   └── vite.config.ts             # Vite config with Tailwind & /api proxy
├── tests/
│   ├── conftest.py                # Pytest path configuration
│   └── test_backend.py            # API tests for CRUD, duplicate prevention, triggers
├── clean_leads.py                 # Standalone Python script for Section 10 lead cleaning
├── leads.csv                      # Exact sample input CSV
├── cleaned_leads.csv              # Exact standardized and deduplicated output CSV
├── invalid_leads.csv              # Error report for invalid phone numbers (if any)
├── test_clean_leads.py            # Unit & integration tests for data cleaning
├── requirements.txt               # Backend Python dependencies
├── .env.example                   # Environment variable template
├── .env                           # Local environment configuration
└── README.md                      # Comprehensive documentation
```

---

## 4. Installation & Setup Instructions

### Prerequisites
- Python 3.10 or higher
- Node.js v18 or higher & npm

### Step 1: Clone or Navigate to Project Directory
```powershell
cd "c:\Users\GANESH\Desktop\Technical_implementation_ Specialist_Assignment"
```

### Step 2: Set Up Python Virtual Environment & Install Dependencies
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt
```

### Step 3: Seed the SQLite Database with Realistic Sample Data
```powershell
python -m backend.seed
```
This populates the database with realistic Bengaluru interior design studio data (Indiranagar sky villas, Koramangala cafes, Whitefield tech offices, 3 designers, invoices, and tasks).

### Step 4: Install Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

---

## 5. Running the Application

### Option A: Run Backend Server (FastAPI on Port 8000)
From the project root:
```powershell
.\venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Swagger Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

### Option B: Run Frontend Development Server (Vite on Port 5173)
From the `frontend` folder:
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Web Application UI: `http://127.0.0.1:5173`
*(Vite automatically proxies all `/api` calls to the backend on `http://127.0.0.1:8000`)*

---

## 6. Running Automated Tests

### Run All 18 Test Cases
From the root directory with virtual environment activated:
```powershell
.\venv\Scripts\pytest -v
```

### Run Python Data Cleaning Tests (Section 10)
```powershell
.\venv\Scripts\pytest test_clean_leads.py -v
```
**Test Coverage:**
- Plain 10-digit phone numbers (`9876543210` &rarr; `+919876543210`)
- Numbers with spaces (`91 98765 12345` &rarr; `+919876512345`)
- Numbers with hyphens (`098-765-99887` &rarr; `+919876599887`)
- Numbers with `+91` (`+919876500000` &rarr; `+919876500000`)
- Numbers starting with `0` (`09876543210` &rarr; `+919876543210`)
- Valid start digit validation (must start with 6, 7, 8, or 9)
- Deduplication of identical (Name, Phone) rows (e.g. Sneha Reddy duplicate)
- Preserving distinct clients with matching phone numbers
- Invalid rows reported to error report without silent discarding

### Run Backend API & Business Logic Tests (Section 14)
```powershell
.\venv\Scripts\pytest tests/test_backend.py -v
```
**Test Coverage:**
- `/api/health` endpoint validation
- `/api/dashboard/summary` dynamic calculations
- Duplicate invoice detection (asserts HTTP 409 Conflict)
- Invoice payment amounts constraint (`Amount Paid <= Invoice Amount`)
- Internal automation trigger on `Project Health = 'At Risk'`
- Lead-to-project conversion (preserves original lead record with status `Converted` and links project ID)

---

## 7. Python Data Cleaning Specification (Section 10)

The standalone script `clean_leads.py` cleans and standardizes client leads.

### Sample Input (`leads.csv`):
```csv
Name,Phone
Ravi Kumar,9876543210
Priya Shah,91 98765 12345
Amit Verma,098-765-99887
Sneha Reddy,+919876500000
Sneha Reddy,9876500000
Karan Mehta,+91-9876511111
```

### Running the CLI Script:
```powershell
python clean_leads.py leads.csv cleaned_leads.csv invalid_leads.csv
```

### Expected & Verified Output (`cleaned_leads.csv`):
```csv
Name,Phone
Ravi Kumar,+919876543210
Priya Shah,+919876512345
Amit Verma,+919876599887
Sneha Reddy,+919876500000
Karan Mehta,+919876511111
```

### Processing Summary:
```text
=============================================
 Sunrise Interiors - Lead Cleaning Summary
=============================================
Total Rows Processed : 6
Valid Cleaned Leads  : 5
Duplicate Rows Removed: 1
Invalid Rows Reported : 0
=============================================
```

---

## 8. n8n Lead Workflow & ClickUp Integration (Sections 11 & 12)

### n8n Proposed Workflow
- **Trigger**: New Google Form response recorded in Google Sheets.
- **Node Pipeline**:
  1. Receive response from Google Sheets row.
  2. Validate client name, email, phone, and budget.
  3. Clean phone to `+91XXXXXXXXXX` and parse budget into integer INR.
  4. Check Google Sheet Column G for existing ClickUp Task ID (idempotency).
  5. Create lead task in ClickUp list **New Leads**.
  6. Write back ClickUp Task ID to Google Sheet to lock duplicate retries.
  7. Send automated personalized confirmation email to client.
  8. Conditional Branch:
     ```text
     IF project_budget > 500000:
       Notify Senior Design Team (Ananya & Vikram)
     ELSE:
       Skip high-budget notification
     ```
  9. Execution telemetry log & error handler with exponential backoff retries.

*A full interactive workflow simulator is embedded directly on the `/automation-workflow` page of the web application, allowing live execution testing with streaming logs.*

### ClickUp Configuration Guide
Accessible at `/clickup-guide` within the application:
1. **Workspace**: `Sunrise Interiors`
2. **Lists**: `Client Projects`, `Vendor & Procurement`, `Design Team Tasks`, `New Leads`
3. **Custom Fields**:
   - *Client Projects*: Client Name, Project Budget (INR), Project Type, Project Location, Expected Handover, Project Health
   - *Vendor & Procurement*: Vendor Name, Invoice Number, Amount Due, Payment Status, Payment Due Date, Payment Reference
   - *Design Team Tasks*: Assigned Designer, Priority, Related Project, Due Date, Task Status
   - *New Leads*: Client Name, Email, Phone, Project Budget, Project Type, Project Location
4. **Automation**: When `Project Health` changes to `At Risk`, notify project owner with detailed alert.
5. **Executive Owner Dashboard**: 5 custom widgets for Active Projects, Projects At Risk, Overdue Tasks, Pending Payments, and Upcoming Handovers.

---

## 9. License & Credits

Built for the **Agile Automate Technical Implementation Specialist Assignment**.  
Developed by Senior Full-Stack & Automation Engineer.
