const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'crm_store.json');

class DatabaseStore {
  constructor() {
    this.data = {
      users: [],
      appointments: [],
      bulkJobs: [],
      auditLogs: [],
      doctors: [],
      topReferrers: []
    };
    this.lockedRowIds = new Set();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed
        };
        console.log(`[DB] Loaded ${this.data.appointments?.length || 0} appointments & ${this.data.doctors?.length || 0} doctors from disk.`);
      } catch (err) {
        console.error('[DB] Failed to read db file, initializing empty:', err.message);
      }
    }
    this.isInitialized = true;
  }

  async persist() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      await fs.promises.writeFile(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Error persisting to disk:', err);
    }
  }

  // Transaction support
  async runInTransaction(callback) {
    const snapshot = JSON.stringify(this.data);
    try {
      const result = await callback(this);
      await this.persist();
      return result;
    } catch (error) {
      console.error('[DB Transaction] Rolled back due to error:', error.message);
      this.data = JSON.parse(snapshot);
      throw error;
    }
  }

  // Row locking for concurrency
  tryLockRows(rowIds) {
    for (const id of rowIds) {
      if (this.lockedRowIds.has(id)) {
        return false;
      }
    }
    for (const id of rowIds) {
      this.lockedRowIds.add(id);
    }
    return true;
  }

  unlockRows(rowIds) {
    for (const id of rowIds) {
      this.lockedRowIds.delete(id);
    }
  }

  // User Operations
  getUsers() {
    return this.data.users || [];
  }

  getUserById(id) {
    return (this.data.users || []).find(u => u.id === id);
  }

  // Appointment Operations
  getAppointments(filters = {}) {
    let list = this.data.appointments || [];

    if (filters.assigneeId) {
      list = list.filter(a => a.assigneeId === filters.assigneeId || a.coachId === filters.assigneeId);
    }
    if (filters.type && filters.type !== 'All') {
      if (filters.type.toLowerCase() === 'cancelled') {
        list = list.filter(a => a.status === 'CANCELLED' || a.type?.toLowerCase() === 'cancelled');
      } else {
        list = list.filter(a => a.type?.toLowerCase() === filters.type.toLowerCase() && a.status !== 'CANCELLED');
      }
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        list = list.filter(a => filters.status.includes(a.status));
      } else {
        list = list.filter(a => a.status === filters.status);
      }
    }
    if (filters.excludeReferral) {
      list = list.filter(a => !a.isReferralOnly);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a => 
        (a.patientName && a.patientName.toLowerCase().includes(q)) ||
        (a.orderId && a.orderId.toLowerCase().includes(q)) ||
        (a.patientId && a.patientId.toLowerCase().includes(q)) ||
        (a.contactName && a.contactName.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (filters.sortBy) {
      const field = filters.sortBy;
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        if (a[field] < b[field]) return -1 * order;
        if (a[field] > b[field]) return 1 * order;
        return 0;
      });
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }

  getAppointmentById(id) {
    return (this.data.appointments || []).find(a => a.id === id);
  }

  updateAppointment(id, updates) {
    const idx = (this.data.appointments || []).findIndex(a => a.id === id);
    if (idx === -1) return null;
    
    const existing = this.data.appointments[idx];
    const updated = {
      ...existing,
      ...updates,
      version: (existing.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };
    this.data.appointments[idx] = updated;
    return updated;
  }

  // Doctor Operations (Task 2)
  getDoctors(filters = {}) {
    let list = this.data.doctors || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(d => 
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.city && d.city.toLowerCase().includes(q)) ||
        (d.mobile && d.mobile.includes(q)) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.specialization && d.specialization.toLowerCase().includes(q))
      );
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(d => d.status?.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.city && filters.city !== 'ALL') {
      list = list.filter(d => d.city?.toLowerCase() === filters.city.toLowerCase());
    }
    return list;
  }

  getDoctorById(id) {
    return (this.data.doctors || []).find(d => d.id === id);
  }

  updateDoctor(id, updates) {
    const idx = (this.data.doctors || []).findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.data.doctors[idx] = {
      ...this.data.doctors[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.data.doctors[idx];
  }

  createDoctor(doctorData) {
    const doc = {
      id: uuidv4(),
      code: `ZH${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'active',
      patientsReferred: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doctorData
    };
    this.data.doctors.unshift(doc);
    return doc;
  }

  getTopReferrers() {
    return this.data.topReferrers || [];
  }

  // Bulk Job Operations
  createBulkJob(jobData) {
    const job = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      processedCount: 0,
      failedCount: 0,
      status: 'PENDING',
      ...jobData
    };
    this.data.bulkJobs.unshift(job);
    return job;
  }

  getBulkJobById(id) {
    return (this.data.bulkJobs || []).find(j => j.id === id);
  }

  updateBulkJob(id, updates) {
    const idx = (this.data.bulkJobs || []).findIndex(j => j.id === id);
    if (idx === -1) return null;
    this.data.bulkJobs[idx] = {
      ...this.data.bulkJobs[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.data.bulkJobs[idx];
  }

  // Audit Logs
  createAuditLog(logEntry) {
    const log = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...logEntry
    };
    this.data.auditLogs.unshift(log);
    return log;
  }

  getAuditLogsByJobId(jobId) {
    return (this.data.auditLogs || []).filter(l => l.bulkJobId === jobId);
  }
}

const db = new DatabaseStore();
module.exports = db;
