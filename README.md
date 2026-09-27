# 🏥 Patient Counseling CRM - Enterprise Bulk Appointment Reassignment System

Built with **Node.js, Express, Socket.IO, and SQLite/JSON Store**.

---

## 📌 Problem Overview (From Assignment Video)
A counselor/coach (**Sonu Singh**) on `zenonco.io/patient-counseling/appointment-list` is changing departments. Currently, they must open every single appointment individually (clicks row $\rightarrow$ opens right drawer $\rightarrow$ changes assignee/coach $\rightarrow$ saves) to reassign their 392 active appointments.

This solution provides a **Production-Grade Bulk Reassignment and Department Handover System** that completes the transfer in **1-Click** while safeguarding data integrity.

---

## 🚀 Key Features

1. **High-Performance Chunked Batch Processing**:
   - Updates hundreds of appointments in async chunks (50-100 per chunk) to avoid database locks and deadlocks.
2. **Safety & Concurrency Safeguards ("किन चीजों का ध्यान रखा गया है")**:
   - **Active Call Protection**: Automatically excludes appointments currently in live phone calls (`call_status = 'IN_PROGRESS'`).
   - **Optimistic Concurrency & Row Locking**: Prevents race conditions from simultaneous supervisor updates.
   - **Status & Date Filters**: Option to exclude cancelled/completed appointments or select specific appointment checkboxes.
3. **Flexible Distribution Strategies**:
   - **Direct Transfer**: Reassign all selected appointments to a single counselor.
   - **Round-Robin Team Distribution**: Load balances appointments evenly across the department.
4. **Full Audit Trail & Rollback Capability**:
   - Every modified field is recorded in `appointment_audit_logs`.
   - Any bulk job can be reverted with 1-click within the grace window.
5. **Real-time Live Progress via WebSockets (Socket.IO)**:
   - Live progress bar showing real-time batch chunk updates without page refreshes.
6. **Pixel-Perfect CRM UI**:
   - Replicates the exact `zenonco.io` interface seen in the video with tabs (`All`, `Consultation`, `Delivery`, `Cancelled`), search, pagination, right slide-out drawer, and the new **Bulk Reassign Modal**.

---

## 📁 Project Structure

```
digital-product/
├── package.json                    # Project dependencies & scripts
├── README.md                       # Comprehensive documentation
├── data/
│   └── crm_store.json              # Local disk persistence
└── src/
    ├── app.js                      # Express application & middleware
    ├── server.js                   # Server & Socket.IO initialization
    ├── config/
    │   ├── constants.js            # System constants & statuses
    │   └── dbStore.js              # Transactional database manager with row locks
    ├── controllers/
    │   ├── appointment.controller.js
    │   ├── bulkReassign.controller.js
    │   └── user.controller.js
    ├── queues/
    │   └── bulkQueue.js            # Asynchronous background batch worker
    ├── routes/
    │   ├── appointment.routes.js   # /api/appointments
    │   ├── bulk.routes.js          # /api/bulk (preview, reassign, status, rollback)
    │   └── user.routes.js          # /api/users
    ├── services/
    │   ├── appointment.service.js
    │   ├── bulkReassignment.service.js
    │   └── notification.service.js # Real-time Socket.IO dispatcher
    ├── utils/
    │   └── seedData.js             # 392 realistic appointments matching video
    └── public/                     # Interactive Frontend Dashboard
        ├── index.html
        ├── css/
        │   └── styles.css
        └── js/
            └── app.js
```

---

## 🛠️ How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Data (Pre-populates 392 appointments & counselors)
```bash
npm run seed
```

### 3. Start the Server
```bash
npm start
```
* Or for development with auto-reload:
```bash
npm run dev
```

### 4. Open in Browser
Visit: **[http://localhost:3000](http://localhost:3000)**

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/appointments` | List appointments with pagination, category filter, and search |
| `GET` | `/api/appointments/:id` | Get single appointment details |
| `PATCH` | `/api/appointments/:id` | Update appointment assignee/coach from drawer |
| `POST` | `/api/bulk/preview` | Preview eligible appointment count and active call warnings |
| `POST` | `/api/bulk/reassign` | Initiate bulk transfer job (Single Target or Round-Robin) |
| `GET` | `/api/bulk/jobs/:jobId` | Get background job progress and audit log samples |
| `POST` | `/api/bulk/jobs/:jobId/undo` | Revert / rollback a previous bulk transfer |
| `GET` | `/api/users` | List all counselors with active appointment workloads |
