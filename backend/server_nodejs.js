const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const { chromium } = require('playwright');

const app = express();
const port = 8001;

// Database setup
const dbPath = path.join(__dirname, 'dataguard.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS removal_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    broker_name TEXT NOT NULL,
    removal_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    error_message TEXT NULL
  )`);
});

// Middleware
app.use(cors());
app.use(express.json());

// Data brokers configuration
const DATA_BROKERS = {
  "whitepages": { "name": "Whitepages", "type": "automated" },
  "spokeo": { "name": "Spokeo", "type": "automated" },
  "beenverified": { "name": "BeenVerified", "type": "automated" },
  "intelius": { "name": "Intelius", "type": "automated" },
  "truepeoplesearch": { "name": "TruePeopleSearch", "type": "automated" },
  "mylife": { "name": "MyLife", "type": "automated" },
  "peoplefinder": { "name": "PeopleFinder", "type": "manual" },
  "familytreenow": { "name": "FamilyTreeNow", "type": "manual" }
};

// Routes
app.get('/api/', (req, res) => {
  res.json({ message: "DataGuard Pro API - Privacy Protection Service" });
});

app.get('/api/brokers', (req, res) => {
  res.json({ brokers: DATA_BROKERS });
});

app.post('/api/users', (req, res) => {
  const { first_name, last_name, email, phone } = req.body;
  const id = require('crypto').randomUUID();
  
  db.run(
    `INSERT INTO users (id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?)`,
    [id, first_name, last_name, email, phone],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        id,
        personal_info: { first_name, last_name, email, phone },
        created_at: new Date().toISOString()
      });
    }
  );
});

app.post('/api/removal/bulk', (req, res) => {
  const { user_id } = req.query;
  
  const requests = Object.values(DATA_BROKERS).map(broker => ({
    id: require('crypto').randomUUID(),
    user_id,
    broker_name: broker.name,
    removal_type: broker.type,
    status: 'pending'
  }));
  
  const stmt = db.prepare(`INSERT INTO removal_requests (id, user_id, broker_name, removal_type, status) VALUES (?, ?, ?, ?, ?)`);
  
  requests.forEach(request => {
    stmt.run([request.id, request.user_id, request.broker_name, request.removal_type, request.status]);
  });
  
  stmt.finalize();
  
  // Start automated processing for automated brokers
  processAutomatedRemovals(user_id);
  
  res.json({
    message: `Created ${requests.length} removal requests`,
    total_requests: requests.length,
    automated_requests: requests.filter(r => r.removal_type === 'automated').length,
    manual_requests: requests.filter(r => r.removal_type === 'manual').length
  });
});

app.get('/api/removal/status/:user_id', (req, res) => {
  const { user_id } = req.params;
  
  db.all(
    `SELECT * FROM removal_requests WHERE user_id = ? ORDER BY created_at DESC`,
    [user_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const stats = {
        total: rows.length,
        pending: rows.filter(r => r.status === 'pending').length,
        in_progress: rows.filter(r => r.status === 'in_progress').length,
        completed: rows.filter(r => r.status === 'completed').length,
        failed: rows.filter(r => r.status === 'failed').length
      };
      
      res.json({ requests: rows, stats });
    }
  );
});

// Automated removal processing
async function processAutomatedRemovals(userId) {
  console.log(`Starting automated removal process for user ${userId}`);
  
  db.all(
    `SELECT * FROM removal_requests WHERE user_id = ? AND removal_type = 'automated' AND status = 'pending'`,
    [userId],
    async (err, requests) => {
      if (err) {
        console.error('Error fetching removal requests:', err);
        return;
      }
      
      // Get user info
      db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, user) => {
        if (err || !user) {
          console.error('User not found:', err);
          return;
        }
        
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        
        for (const request of requests) {
          try {
            // Update status to in_progress
            db.run(`UPDATE removal_requests SET status = 'in_progress' WHERE id = ?`, [request.id]);
            
            console.log(`Processing ${request.broker_name} for user ${userId}`);
            
            // Simulate removal process (replace with actual automation)
            const success = await simulateRemoval(context, request.broker_name, user);
            
            const newStatus = success ? 'completed' : 'failed';
            const completedAt = success ? new Date().toISOString() : null;
            
            db.run(
              `UPDATE removal_requests SET status = ?, completed_at = ? WHERE id = ?`,
              [newStatus, completedAt, request.id]
            );
            
            console.log(`${request.broker_name} removal ${newStatus} for user ${userId}`);
            
            // Wait between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 5000));
            
          } catch (error) {
            console.error(`Error processing ${request.broker_name}:`, error);
            db.run(
              `UPDATE removal_requests SET status = 'failed', error_message = ? WHERE id = ?`,
              [error.message, request.id]
            );
          }
        }
        
        await browser.close();
        console.log(`Completed automated removal process for user ${userId}`);
      });
    }
  );
}

// Simulate removal process (replace with actual Playwright automation)
async function simulateRemoval(context, brokerName, user) {
  console.log(`Simulating removal from ${brokerName} for ${user.first_name} ${user.last_name}`);
  
  // This is where you'd implement actual Playwright automation
  // For now, we'll simulate success/failure randomly
  return Math.random() > 0.3; // 70% success rate for demo
}

// Start server
app.listen(port, '127.0.0.1', () => {
  console.log(`DataGuard Pro backend running at http://127.0.0.1:${port}`);
});

module.exports = app;