/**
 * DeRisk.biz — Governance Vulnerability Assessment
 * Backend: Express + Mongoose (MongoDB Atlas Free Tier M0)
 * Falls back to local JSON storage if no MONGODB_URI is configured,
 * so the app always works (dev / demo mode).
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

/* ----------------------------- Middleware ------------------------------ */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '200kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

/* Static frontend (no cache for development / hot-reloads) */
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: 0,
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    },
  })
);

/* ------------------------------- Schemas ------------------------------- */
const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: mongoose.Schema.Types.Mixed, required: true }, // string or [string]
    isBest: { type: Boolean, default: null }, // null for context questions
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
      index: true,
    },
    name: { type: String, trim: true, maxlength: 120, default: '' },
    company: { type: String, trim: true, maxlength: 160, default: '' },
    surveys: {
      governance: {
        completed: { type: Boolean, default: false },
        context: [AnswerSchema], // Section 1 — context setting
        scenarios: [AnswerSchema], // Section 2 — scenarios
        score: { type: Number, default: 0 },
        maxScore: { type: Number, default: 0 },
        riskLevel: { type: String, default: '' },
      },
      legalVsEnterprise: {
        completed: { type: Boolean, default: false },
        scenarios: [AnswerSchema],
        score: { type: Number, default: 0 },
        maxScore: { type: Number, default: 0 },
        riskLevel: { type: String, default: '' },
      },
    },
    meta: {
      userAgent: String,
      referrer: String,
      durationSeconds: Number,
    },
  },
  { timestamps: true }
);

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120, required: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },
    company: { type: String, trim: true, maxlength: 160, default: '' },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    wantsConsultation: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Submission = mongoose.model('Submission', SubmissionSchema);
const Contact = mongoose.model('Contact', ContactSchema);

/* --------------------- Storage layer (Mongo or file) ------------------- */
let usingMongo = false;
const DATA_DIR = path.join(__dirname, 'data');
const FILE_DB = path.join(DATA_DIR, 'local-db.json');

function readFileDb() {
  try {
    return JSON.parse(fs.readFileSync(FILE_DB, 'utf8'));
  } catch {
    return { submissions: [], contacts: [] };
  }
}
function writeFileDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_DB, JSON.stringify(db, null, 2));
}

const store = {
  async saveSubmission(doc) {
    if (usingMongo) {
      const saved = await Submission.create(doc);
      return saved.toObject();
    }
    const db = readFileDb();
    const rec = { _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), ...doc, createdAt: new Date().toISOString() };
    db.submissions.push(rec);
    writeFileDb(db);
    return rec;
  },
  async saveContact(doc) {
    if (usingMongo) {
      const saved = await Contact.create(doc);
      return saved.toObject();
    }
    const db = readFileDb();
    const rec = { _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), ...doc, createdAt: new Date().toISOString() };
    db.contacts.push(rec);
    writeFileDb(db);
    return rec;
  },
  async listSubmissions() {
    if (usingMongo) return Submission.find().sort({ createdAt: -1 }).limit(500).lean();
    return readFileDb().submissions.slice().reverse();
  },
  async listContacts() {
    if (usingMongo) return Contact.find().sort({ createdAt: -1 }).limit(500).lean();
    return readFileDb().contacts.slice().reverse();
  },
  async deleteSubmission(id) {
    if (usingMongo) {
      await Submission.findByIdAndDelete(id);
      return;
    }
    const db = readFileDb();
    db.submissions = db.submissions.filter((s) => String(s._id) !== String(id));
    writeFileDb(db);
  },
  async deleteContact(id) {
    if (usingMongo) {
      await Contact.findByIdAndDelete(id);
      return;
    }
    const db = readFileDb();
    db.contacts = db.contacts.filter((c) => String(c._id) !== String(id));
    writeFileDb(db);
  },
  async stats() {
    let subs = [];
    let cons = [];
    if (usingMongo) {
      subs = await Submission.find().lean();
      cons = await Contact.find().lean();
    } else {
      const db = readFileDb();
      subs = db.submissions;
      cons = db.contacts;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const last7DaysCount = subs.filter(s => new Date(s.createdAt) >= sevenDaysAgo).length;
    const consultCount = cons.filter(c => c.wantsConsultation).length;
    const govCount = subs.filter(s => s.surveys?.governance?.completed).length;
    const legalCount = subs.filter(s => s.surveys?.legalVsEnterprise?.completed).length;

    // perDay for last 14 days
    const perDay = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const count = subs.filter(s => {
        const cDate = new Date(s.createdAt);
        return cDate.getFullYear() === yyyy &&
               String(cDate.getMonth() + 1).padStart(2, '0') === mm &&
               String(cDate.getDate()).padStart(2, '0') === dd;
      }).length;
      perDay.push({ date: dateStr, count });
    }

    // riskCounts and average score
    const riskCounts = { 'Low Vulnerability': 0, 'Moderate Vulnerability': 0, 'High Vulnerability': 0 };
    let totalScore = 0;
    let totalMax = 0;

    subs.forEach(s => {
      if (s.surveys?.governance?.completed) {
        const r = s.surveys.governance;
        riskCounts[r.riskLevel] = (riskCounts[r.riskLevel] || 0) + 1;
        totalScore += r.score || 0;
        totalMax += r.maxScore || 0;
      }
      if (s.surveys?.legalVsEnterprise?.completed) {
        const r = s.surveys.legalVsEnterprise;
        riskCounts[r.riskLevel] = (riskCounts[r.riskLevel] || 0) + 1;
        totalScore += r.score || 0;
        totalMax += r.maxScore || 0;
      }
    });

    const avgScorePct = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;

    return {
      storage: usingMongo ? 'MongoDB Atlas' : 'local file',
      submissions: subs.length,
      contacts: cons.length,
      last7Days: last7DaysCount,
      consultRequests: consultCount,
      govCompleted: govCount,
      legalCompleted: legalCount,
      perDay,
      riskCounts,
      avgScorePct
    };
  },
};

/* ------------------------------ Validation ----------------------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeAnswers(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 40).map((a) => ({
    questionId: String(a.questionId || '').slice(0, 60),
    question: String(a.question || '').slice(0, 500),
    answer: Array.isArray(a.answer) ? a.answer.map((x) => String(x).slice(0, 300)).slice(0, 15) : String(a.answer || '').slice(0, 500),
    isBest: typeof a.isBest === 'boolean' ? a.isBest : null,
  }));
}

/* -------------------------------- Routes ------------------------------- */
app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, storage: usingMongo ? 'mongodb-atlas' : 'local-file-fallback', time: new Date().toISOString() });
});

/** Final submission — sent after the user finishes answering and provides email */
app.post('/api/submissions', async (req, res) => {
  try {
    const { email, name, company, surveys, meta } = req.body || {};
    if (!email || !EMAIL_RE.test(String(email))) {
      return res.status(400).json({ ok: false, error: 'A valid email is required.' });
    }
    if (!surveys || (!surveys.governance && !surveys.legalVsEnterprise)) {
      return res.status(400).json({ ok: false, error: 'At least one completed survey is required.' });
    }

    const doc = {
      email: String(email).trim().toLowerCase(),
      name: String(name || '').slice(0, 120),
      company: String(company || '').slice(0, 160),
      surveys: {
        governance: {
          completed: !!(surveys.governance && surveys.governance.completed),
          context: sanitizeAnswers(surveys.governance?.context),
          scenarios: sanitizeAnswers(surveys.governance?.scenarios),
          score: Number(surveys.governance?.score) || 0,
          maxScore: Number(surveys.governance?.maxScore) || 0,
          riskLevel: String(surveys.governance?.riskLevel || '').slice(0, 60),
        },
        legalVsEnterprise: {
          completed: !!(surveys.legalVsEnterprise && surveys.legalVsEnterprise.completed),
          scenarios: sanitizeAnswers(surveys.legalVsEnterprise?.scenarios),
          score: Number(surveys.legalVsEnterprise?.score) || 0,
          maxScore: Number(surveys.legalVsEnterprise?.maxScore) || 0,
          riskLevel: String(surveys.legalVsEnterprise?.riskLevel || '').slice(0, 60),
        },
      },
      meta: {
        userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
        referrer: String(meta?.referrer || '').slice(0, 300),
        durationSeconds: Number(meta?.durationSeconds) || 0,
      },
    };

    const saved = await store.saveSubmission(doc);
    res.status(201).json({ ok: true, id: saved._id, message: 'Your assessment has been recorded. We will reach out at ' + doc.email });
  } catch (err) {
    console.error('POST /api/submissions failed:', err.message);
    res.status(500).json({ ok: false, error: 'Could not save your submission. Please try again.' });
  }
});

/** Contact / consultation requests */
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, message, wantsConsultation } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: 'Name is required.' });
    if (!email || !EMAIL_RE.test(String(email))) return res.status(400).json({ ok: false, error: 'A valid email is required.' });

    const saved = await store.saveContact({
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().toLowerCase(),
      company: String(company || '').slice(0, 160),
      message: String(message || '').slice(0, 2000),
      wantsConsultation: !!wantsConsultation,
    });
    res.status(201).json({ ok: true, id: saved._id, message: 'Thanks! Our team will contact you shortly.' });
  } catch (err) {
    console.error('POST /api/contact failed:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send your message. Please try again.' });
  }
});

/* ----- Simple token-protected admin endpoints (set ADMIN_TOKEN in .env) ---- */
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(403).json({ ok: false, error: 'Admin access not configured.' });
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  next();
}
app.get('/api/admin/submissions', requireAdmin, async (_req, res) => res.json({ ok: true, data: await store.listSubmissions() }));
app.get('/api/admin/contacts', requireAdmin, async (_req, res) => res.json({ ok: true, data: await store.listContacts() }));
app.get('/api/admin/stats', requireAdmin, async (_req, res) => res.json({ ok: true, data: await store.stats() }));

app.post('/api/admin/login', (req, res) => {
  const { token } = req.body || {};
  if (!ADMIN_TOKEN) {
    return res.status(403).json({ ok: false, error: 'Admin access not configured.' });
  }
  if (token === ADMIN_TOKEN) {
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false, error: 'Invalid admin token.' });
});

app.delete('/api/admin/submissions/:id', requireAdmin, async (req, res) => {
  try {
    await store.deleteSubmission(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/admin/contacts/:id', requireAdmin, async (req, res) => {
  try {
    await store.deleteContact(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/admin/export/submissions', requireAdmin, async (_req, res) => {
  try {
    const list = await store.listSubmissions();
    let csv = '\uFEFFID,Email,Name,Company,Governance Completed,Governance Score,Governance Max,Governance Risk,Legal Completed,Legal Score,Legal Max,Legal Risk,Date\r\n';
    list.forEach((s) => {
      const g = s.surveys?.governance || {};
      const l = s.surveys?.legalVsEnterprise || {};
      const row = [
        s._id,
        s.email,
        s.name || '',
        s.company || '',
        g.completed ? 'Yes' : 'No',
        g.completed ? g.score : '',
        g.completed ? g.maxScore : '',
        g.completed ? g.riskLevel : '',
        l.completed ? 'Yes' : 'No',
        l.completed ? l.score : '',
        l.completed ? l.maxScore : '',
        l.completed ? l.riskLevel : '',
        s.createdAt ? new Date(s.createdAt).toISOString() : ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      csv += row + '\r\n';
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=derisk-submissions-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not export submissions.' });
  }
});

app.get('/api/admin/export/contacts', requireAdmin, async (_req, res) => {
  try {
    const list = await store.listContacts();
    let csv = '\uFEFFID,Name,Email,Company,Wants Consultation,Message,Date\r\n';
    list.forEach((c) => {
      const row = [
        c._id,
        c.name,
        c.email,
        c.company || '',
        c.wantsConsultation ? 'Yes' : 'No',
        c.message || '',
        c.createdAt ? new Date(c.createdAt).toISOString() : ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      csv += row + '\r\n';
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=derisk-contacts-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not export contacts.' });
  }
});

/* SPA fallback */
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* -------------------------------- Startup ------------------------------ */
async function start() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
      usingMongo = true;
      console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
      console.error('⚠️  MongoDB connection failed → using local file fallback:', err.message);
    }
  } else {
    console.log('ℹ️  No MONGODB_URI set → using local file storage (data/local-db.json). Set it in .env for MongoDB Atlas free tier.');
  }
  app.listen(PORT, () => console.log(`🚀 DeRisk.biz running at http://localhost:${PORT} (storage: ${usingMongo ? 'MongoDB Atlas' : 'local file'})`));
}
start();
