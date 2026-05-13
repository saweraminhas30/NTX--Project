/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         NTX Construction Group — Backend Server                 ║
 * ║         Pure Node.js · Zero dependencies · Single file          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * HOW TO RUN:
 *   1. Make sure Node.js is installed  (https://nodejs.org)
 *   2. Put this file in the same folder as index.html and admin.html
 *   3. Open a terminal in that folder and run:
 *           node server.js
 *   4. Open http://localhost:3000  in your browser
 *
 * THAT'S IT. No npm install. No pip. Nothing else needed.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const PORT        = 3000;
const DB_FILE     = path.join(__dirname, 'database.json');   // flat-file "database"
const UPLOADS_DIR = path.join(__dirname, 'uploads');         // where attachments go

// ─────────────────────────────────────────────
//  MIME TYPES (for serving static files)
// ─────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.pdf' : 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// ─────────────────────────────────────────────
//  FLAT-FILE DATABASE  (reads/writes database.json)
// ─────────────────────────────────────────────
const DEFAULT_DB = {
  leads:    [],   // quote request submissions
  services: [
    { id:1, name:'Home Renovation / Remodeling', category:'residential', description:'Full-scale home remodels tailored to your vision.', icon:'fa-home', active:true, order:1 },
    { id:2, name:'Kitchen Remodel',              category:'residential', description:'Modern kitchen upgrades and full remodels.',          icon:'fa-utensils', active:true, order:2 },
    { id:3, name:'Bathroom Remodel',             category:'residential', description:'Luxury bathroom renovations.',                         icon:'fa-bath', active:true, order:3 },
    { id:4, name:'Foundation Repair',            category:'residential', description:'Expert foundation diagnostics and repair.',            icon:'fa-layer-group', active:true, order:4 },
    { id:5, name:'Commercial Build-Out',         category:'commercial',  description:'Tenant finish-outs and commercial interiors.',         icon:'fa-building', active:true, order:5 },
    { id:6, name:'Roofing',                      category:'residential', description:'Roofing installation, repair, and replacement.',       icon:'fa-house-damage', active:true, order:6 },
    { id:7, name:'HVAC Services',                category:'residential', description:'Heating, ventilation, and air conditioning.',          icon:'fa-wind', active:true, order:7 },
    { id:8, name:'Solar Power',                  category:'residential', description:'Solar panel installation for homes and businesses.',   icon:'fa-solar-panel', active:true, order:8 },
    { id:9, name:'Maintenance Plans',            category:'commercial',  description:'Quarterly and annual property maintenance contracts.', icon:'fa-tools', active:true, order:9 },
  ],
  projects: [
    { id:1, title:'Interior Renovation',  category:'residential', location:'Plano, TX',       year:2024, featured:true,  active:true, description:'Complete interior renovation.', order:1 },
    { id:2, title:'Kitchen Remodel',      category:'residential', location:'Dallas, TX',      year:2024, featured:false, active:true, description:'Modern kitchen transformation.', order:2 },
    { id:3, title:'Landscaping & Yard',   category:'exterior',    location:'Frisco, TX',      year:2023, featured:false, active:true, description:'Full landscaping project.', order:3 },
    { id:4, title:'Concrete Patio',       category:'concrete',    location:'Irving, TX',      year:2024, featured:true,  active:true, description:'Stamped concrete patio.', order:4 },
    { id:5, title:'Bathroom Remodel',     category:'residential', location:'Fort Worth, TX',  year:2024, featured:false, active:true, description:'Luxury bathroom renovation.', order:5 },
    { id:6, title:'Fence Installation',   category:'exterior',    location:'Arlington, TX',   year:2023, featured:false, active:true, description:'Cedar privacy fence.', order:6 },
    { id:7, title:'Foundation Repair',    category:'concrete',    location:'Dallas, TX',      year:2024, featured:true,  active:true, description:'Pier and beam foundation fix.', order:7 },
    { id:8, title:'Commercial Build-Out', category:'commercial',  location:'Plano, TX',       year:2024, featured:true,  active:true, description:'Office tenant finish-out.', order:8 },
  ],
  reviews: [
    { id:1, name:'Sarah Thompson',    title:'Homeowner, Frisco TX',           text:'NTX completely transformed our home. The team was professional and kept us informed throughout. Highly recommend!', rating:5, type:'residential', verified:true, shown:true, order:1 },
    { id:2, name:'Michael Ross',      title:'Homeowner, Plano TX',            text:'They handled our home renovation with such care. The team was communicative and kept everything clean. Delivered on time!', rating:5, type:'residential', verified:true, shown:true, order:2 },
    { id:3, name:'David Hernandez',   title:'Property Manager, Dallas TX',    text:'Ahmed and his team are true professionals. My go-to contractor for all DFW properties. Foundation work was done perfectly.', rating:5, type:'commercial', verified:true, shown:true, order:3 },
    { id:4, name:'Jennifer Martinez', title:'Business Owner, Fort Worth TX',  text:'Our tenant finish-out was completed on budget and ahead of schedule. Very responsive team. Would absolutely use NTX again.', rating:5, type:'commercial', verified:true, shown:true, order:4 },
    { id:5, name:'Robert Kim',        title:'Homeowner, Frisco TX',           text:'Kitchen and bathroom remodel came out exactly as we envisioned. Great craftsmanship, fair pricing, and no surprises.', rating:5, type:'residential', verified:true, shown:true, order:5 },
    { id:6, name:'Lisa Thompson',     title:'HOA Manager, Irving TX',         text:"NTX handles our community's quarterly maintenance and they're fantastic. Always on time, thorough, and professional.", rating:5, type:'commercial', verified:true, shown:true, order:6 },
  ],
  settings: {
    companyName:    'NTX Construction Group',
    tagline:        'Where Vision Comes To Life',
    phonePrimary:   '(214) 892-7751',
    phoneSecondary: '(214) 606-3270',
    email:          'info@ntxcgroup.com',
    website:        'https://ntxcgroup.com',
    serviceArea:    'Dallas · Fort Worth · Plano · Frisco · Irving · Arlington',
    heroHeadline:   'Where Vision Comes To Life',
    heroSubtext:    'Licensed & insured general contractor serving Dallas–Fort Worth.',
    facebook:  '',
    instagram: '',
    linkedin:  '',
    google:    '',
    statProjects: '500+',
    statYears:    '10+',
    statClients:  '300+',
    statRating:   '5.0',
  },
  // Simple admin credentials (change these!)
  admin: {
    username: 'admin',
    password: 'ntx2024',   // ← CHANGE THIS
  },
  // Session tokens (in-memory, cleared on restart)
  _nextId: { leads:1, services:10, projects:9, reviews:7 },
};

// ── Load or initialize the database ──
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    saveDB(DEFAULT_DB);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) {
    console.error('DB read error, using defaults:', e.message);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── In-memory sessions ──
const sessions = new Map();

function createSession(username) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessions.set(token, { username, created: Date.now() });
  return token;
}

function isValidSession(token) {
  if (!token || !sessions.has(token)) return false;
  const s = sessions.get(token);
  // Sessions expire after 24 hours
  if (Date.now() - s.created > 86400000) { sessions.delete(token); return false; }
  return true;
}

function getTokenFromRequest(req) {
  const cookie = req.headers.cookie || '';
  const match  = cookie.match(/ntx_session=([^;]+)/);
  if (match) return match[1];
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function json(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
    'Access-Control-Allow-Credentials': 'true',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      const ct  = req.headers['content-type'] || '';
      if (ct.includes('application/json')) {
        try { resolve({ fields: JSON.parse(raw.toString()), files: {} }); }
        catch(e) { resolve({ fields: {}, files: {} }); }
      } else if (ct.includes('multipart/form-data')) {
        resolve(parseMultipart(raw, ct));
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(raw.toString());
        const fields = {};
        params.forEach((v, k) => { fields[k] = v; });
        resolve({ fields, files: {} });
      } else {
        resolve({ fields: {}, files: {} });
      }
    });
    req.on('error', reject);
  });
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  if (!boundaryMatch) return { fields: {}, files: {} };
  const boundary = '--' + boundaryMatch[1].trim();
  const fields = {}, files = {};
  const parts = buffer.toString('binary').split(boundary);
  for (const part of parts) {
    if (!part || part.trim() === '--' || part.trim() === '') continue;
    const [rawHeaders, ...bodyParts] = part.split('\r\n\r\n');
    if (!rawHeaders) continue;
    const bodyBinary = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');
    const nameMatch = rawHeaders.match(/name="([^"]+)"/);
    const fileMatch = rawHeaders.match(/filename="([^"]+)"/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    if (fileMatch) {
      const filename = fileMatch[1];
      const ctMatch  = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i);
      const mimetype = ctMatch ? ctMatch[1].trim() : 'application/octet-stream';
      const fileBuffer = Buffer.from(bodyBinary, 'binary');
      if (!files[name]) files[name] = [];
      files[name].push({ filename, mimetype, buffer: fileBuffer });
    } else {
      fields[name] = bodyBinary;
    }
  }
  return { fields, files };
}

function nextId(db, key) {
  if (!db._nextId) db._nextId = {};
  if (!db._nextId[key]) db._nextId[key] = 1;
  return db._nextId[key]++;
}

// ─────────────────────────────────────────────
//  STATIC FILE SERVER
// ─────────────────────────────────────────────
function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

// ─────────────────────────────────────────────
//  ROUTER
// ─────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  const method   = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
    });
    res.end(); return;
  }

  // ── Serve uploaded files ──
  if (pathname.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, pathname);
    serveStatic(res, filePath); return;
  }

  // ── Serve HTML pages ──
  if (pathname === '/' || pathname === '/index.html') {
    serveStatic(res, path.join(__dirname, 'index.html')); return;
  }
  if (pathname === '/admin' || pathname === '/admin.html' || pathname === '/admin-panel') {
    serveStatic(res, path.join(__dirname, 'admin.html')); return;
  }

  // ── Serve any other static file (css, js, images) ──
  if (!pathname.startsWith('/api')) {
    const filePath = path.join(__dirname, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      serveStatic(res, filePath); return;
    }
  }

  // ──────────────────────────────────────────
  //  API ROUTES
  // ──────────────────────────────────────────

  // ── POST /api/login ──
  if (pathname === '/api/login' && method === 'POST') {
    const { fields } = await readBody(req);
    const db = loadDB();
    if (fields.username === db.admin.username && fields.password === db.admin.password) {
      const token = createSession(fields.username);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `ntx_session=${token}; Path=/; HttpOnly; SameSite=Lax`,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ success: true, token }));
    } else {
      json(res, 401, { success: false, error: 'Invalid username or password.' });
    }
    return;
  }

  // ── POST /api/logout ──
  if (pathname === '/api/logout' && method === 'POST') {
    const token = getTokenFromRequest(req);
    if (token) sessions.delete(token);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': 'ntx_session=; Path=/; Max-Age=0',
    });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ── POST /api/quote  (public — no login needed) ──
  if (pathname === '/api/quote' && method === 'POST') {
    const { fields, files } = await readBody(req);
    const { name, email, phone, message, project_type, address, preferred_contact } = fields;

    if (!name || !email || !phone || !message) {
      json(res, 400, { success: false, error: 'Name, email, phone and message are required.' });
      return;
    }

    const db    = loadDB();
    const newId = nextId(db, 'leads');

    // Save any attached files
    const attachments = [];
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const allFiles = [...(files['attachments'] || []), ...(files['files'] || [])];
    for (const file of allFiles) {
      const safeName = `${Date.now()}_${newId}_${file.filename.replace(/[^a-z0-9._-]/gi, '_')}`;
      const dest     = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(dest, file.buffer);
      attachments.push({ filename: file.filename, path: `/uploads/${safeName}`, size: file.buffer.length });
    }

    const lead = {
      id: newId,
      name, email, phone, message,
      project_type:       project_type       || '',
      address:            address            || '',
      preferred_contact:  preferred_contact  || 'any',
      status:       'new',
      admin_notes:  '',
      attachments,
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    };

    db.leads.push(lead);
    saveDB(db);

    console.log(`[NEW LEAD] ${name} | ${email} | ${phone} | ${project_type || 'General'}`);

    json(res, 201, {
      success: true,
      message: "Thank you! We've received your request and will contact you within 24 hours.",
      id: newId,
    });
    return;
  }

  // ── GET /api/services  (public) ──
  if (pathname === '/api/services' && method === 'GET') {
    const db = loadDB();
    const category = parsed.query.category;
    let list = db.services.filter(s => s.active);
    if (category) list = list.filter(s => s.category === category);
    list.sort((a, b) => a.order - b.order);
    json(res, 200, { success: true, data: list });
    return;
  }

  // ── GET /api/projects  (public) ──
  if (pathname === '/api/projects' && method === 'GET') {
    const db = loadDB();
    const category = parsed.query.category;
    let list = db.projects.filter(p => p.active);
    if (category && category !== 'all') list = list.filter(p => p.category === category);
    list.sort((a, b) => a.order - b.order);
    json(res, 200, { success: true, data: list });
    return;
  }

  // ── GET /api/reviews  (public) ──
  if (pathname === '/api/reviews' && method === 'GET') {
    const db   = loadDB();
    const list = db.reviews.filter(r => r.shown).sort((a, b) => a.order - b.order);
    json(res, 200, { success: true, data: list });
    return;
  }

  // ── GET /api/settings  (public) ──
  if (pathname === '/api/settings' && method === 'GET') {
    const db = loadDB();
    json(res, 200, { success: true, data: db.settings });
    return;
  }

  // ──────────────────────────────────────────
  //  ADMIN API  (all require valid session)
  // ──────────────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    const token = getTokenFromRequest(req);
    if (!isValidSession(token)) {
      json(res, 401, { success: false, error: 'Unauthorized. Please log in.' });
      return;
    }

    const db = loadDB();

    // ── GET /api/admin/stats ──
    if (pathname === '/api/admin/stats' && method === 'GET') {
      const leads = db.leads;
      json(res, 200, {
        success: true,
        data: {
          total_leads:    leads.length,
          new_leads:      leads.filter(l => l.status === 'new').length,
          in_review:      leads.filter(l => l.status === 'in_review').length,
          replied:        leads.filter(l => l.status === 'replied').length,
          won:            leads.filter(l => l.status === 'won').length,
          closed:         leads.filter(l => l.status === 'closed').length,
          total_services: db.services.length,
          total_projects: db.projects.length,
          total_reviews:  db.reviews.length,
        },
      });
      return;
    }

    // ── GET /api/admin/leads ──
    if (pathname === '/api/admin/leads' && method === 'GET') {
      let list = [...db.leads].reverse(); // newest first
      if (parsed.query.status) list = list.filter(l => l.status === parsed.query.status);
      json(res, 200, { success: true, count: list.length, data: list });
      return;
    }

    // ── GET /api/admin/leads/:id ──
    const leadMatch = pathname.match(/^\/api\/admin\/leads\/(\d+)$/);
    if (leadMatch) {
      const id   = parseInt(leadMatch[1]);
      const lead = db.leads.find(l => l.id === id);
      if (!lead) { json(res, 404, { success: false, error: 'Lead not found.' }); return; }

      if (method === 'GET') {
        json(res, 200, { success: true, data: lead }); return;
      }
      if (method === 'PATCH' || method === 'PUT') {
        const { fields } = await readBody(req);
        if (fields.status)      lead.status      = fields.status;
        if (fields.admin_notes !== undefined) lead.admin_notes = fields.admin_notes;
        lead.updated_at = new Date().toISOString();
        saveDB(db);
        json(res, 200, { success: true, data: lead }); return;
      }
      if (method === 'DELETE') {
        db.leads = db.leads.filter(l => l.id !== id);
        saveDB(db);
        json(res, 200, { success: true, message: 'Lead deleted.' }); return;
      }
    }

    // ── SERVICES CRUD ──
    if (pathname === '/api/admin/services' && method === 'GET') {
      json(res, 200, { success: true, data: db.services }); return;
    }
    if (pathname === '/api/admin/services' && method === 'POST') {
      const { fields } = await readBody(req);
      const svc = { id: nextId(db, 'services'), name: fields.name, category: fields.category || 'residential', description: fields.description || '', icon: fields.icon || '', active: true, order: db.services.length + 1 };
      db.services.push(svc); saveDB(db);
      json(res, 201, { success: true, data: svc }); return;
    }
    const svcMatch = pathname.match(/^\/api\/admin\/services\/(\d+)$/);
    if (svcMatch) {
      const id  = parseInt(svcMatch[1]);
      const idx = db.services.findIndex(s => s.id === id);
      if (idx === -1) { json(res, 404, { success: false, error: 'Service not found.' }); return; }
      if (method === 'PATCH' || method === 'PUT') {
        const { fields } = await readBody(req);
        Object.assign(db.services[idx], fields);
        saveDB(db); json(res, 200, { success: true, data: db.services[idx] }); return;
      }
      if (method === 'DELETE') {
        db.services.splice(idx, 1); saveDB(db);
        json(res, 200, { success: true, message: 'Service deleted.' }); return;
      }
    }

    // ── PROJECTS CRUD ──
    if (pathname === '/api/admin/projects' && method === 'GET') {
      json(res, 200, { success: true, data: db.projects }); return;
    }
    if (pathname === '/api/admin/projects' && method === 'POST') {
      const { fields } = await readBody(req);
      const proj = { id: nextId(db, 'projects'), title: fields.title, category: fields.category || 'residential', description: fields.description || '', location: fields.location || '', year: parseInt(fields.year) || new Date().getFullYear(), featured: false, active: true, order: db.projects.length + 1 };
      db.projects.push(proj); saveDB(db);
      json(res, 201, { success: true, data: proj }); return;
    }
    const projMatch = pathname.match(/^\/api\/admin\/projects\/(\d+)$/);
    if (projMatch) {
      const id  = parseInt(projMatch[1]);
      const idx = db.projects.findIndex(p => p.id === id);
      if (idx === -1) { json(res, 404, { success: false, error: 'Project not found.' }); return; }
      if (method === 'PATCH' || method === 'PUT') {
        const { fields } = await readBody(req);
        Object.assign(db.projects[idx], fields);
        saveDB(db); json(res, 200, { success: true, data: db.projects[idx] }); return;
      }
      if (method === 'DELETE') {
        db.projects.splice(idx, 1); saveDB(db);
        json(res, 200, { success: true, message: 'Project deleted.' }); return;
      }
    }

    // ── REVIEWS CRUD ──
    if (pathname === '/api/admin/reviews' && method === 'GET') {
      json(res, 200, { success: true, data: db.reviews }); return;
    }
    if (pathname === '/api/admin/reviews' && method === 'POST') {
      const { fields } = await readBody(req);
      const rev = { id: nextId(db, 'reviews'), name: fields.name, title: fields.title || '', text: fields.text, rating: parseInt(fields.rating) || 5, type: fields.type || 'residential', verified: true, shown: true, order: db.reviews.length + 1 };
      db.reviews.push(rev); saveDB(db);
      json(res, 201, { success: true, data: rev }); return;
    }
    const revMatch = pathname.match(/^\/api\/admin\/reviews\/(\d+)$/);
    if (revMatch) {
      const id  = parseInt(revMatch[1]);
      const idx = db.reviews.findIndex(r => r.id === id);
      if (idx === -1) { json(res, 404, { success: false, error: 'Review not found.' }); return; }
      if (method === 'PATCH' || method === 'PUT') {
        const { fields } = await readBody(req);
        Object.assign(db.reviews[idx], fields);
        saveDB(db); json(res, 200, { success: true, data: db.reviews[idx] }); return;
      }
      if (method === 'DELETE') {
        db.reviews.splice(idx, 1); saveDB(db);
        json(res, 200, { success: true, message: 'Review deleted.' }); return;
      }
    }

    // ── SETTINGS ──
    if (pathname === '/api/admin/settings') {
      if (method === 'GET') {
        json(res, 200, { success: true, data: db.settings }); return;
      }
      if (method === 'PATCH' || method === 'PUT' || method === 'POST') {
        const { fields } = await readBody(req);
        Object.assign(db.settings, fields);
        saveDB(db); json(res, 200, { success: true, data: db.settings }); return;
      }
    }

    // ── CHANGE ADMIN PASSWORD ──
    if (pathname === '/api/admin/change-password' && method === 'POST') {
      const { fields } = await readBody(req);
      if (!fields.newPassword || fields.newPassword.length < 6) {
        json(res, 400, { success: false, error: 'Password must be at least 6 characters.' }); return;
      }
      db.admin.password = fields.newPassword;
      if (fields.username) db.admin.username = fields.username;
      saveDB(db);
      json(res, 200, { success: true, message: 'Credentials updated.' }); return;
    }

    // ── Unknown admin route ──
    json(res, 404, { success: false, error: 'API endpoint not found.' });
    return;
  }

  // ── Fallback 404 ──
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   NTX Construction Group — Server Running    ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Website  →  http://localhost:${PORT}           ║`);
  console.log(`║  Admin    →  http://localhost:${PORT}/admin      ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Default login:  admin / ntx2024             ║');
  console.log('║  Data saved to:  database.json               ║');
  console.log('╚══════════════════════════════════════════════╝\n');
});
