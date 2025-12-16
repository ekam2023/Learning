const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// --- DEFAULT DATA (Used if db.json doesn't exist) ---
const defaultDb = {
  users: [
    { id: 'u1', name: 'Alice Chen', role: 'Engineer', avatar: 'https://picsum.photos/id/64/100/100' },
    { id: 'u2', name: 'Bob Smith', role: 'Engineer', avatar: 'https://picsum.photos/id/65/100/100' },
    { id: 'u3', name: 'Charlie Kim', role: 'Lead', avatar: 'https://picsum.photos/id/66/100/100' },
    { id: 'u4', name: 'David Lee', role: 'Engineer', avatar: 'https://picsum.photos/id/67/100/100' },
  ],
  courses: [
    { 
      id: 'c1', 
      title: 'Kubernetes in 100 Seconds', 
      description: 'A quick, high-level overview of Kubernetes architecture and concepts.',
      url: 'https://www.youtube.com/watch?v=lxxyY5e_h2o', 
      durationMinutes: 15,
      createdBy: 'u3',
      tags: ['K8s', 'DevOps', 'Cloud'],
      quiz: {
        questions: [
            { id: 'q1', text: 'What is the smallest deployable unit in K8s?', options: ['Node', 'Pod', 'Container', 'Cluster'], correctAnswerIndex: 1 },
            { id: 'q2', text: 'Which component manages the cluster?', options: ['Worker Node', 'Control Plane', 'Kubelet', 'Proxy'], correctAnswerIndex: 1 }
        ]
      }
    },
    { 
      id: 'c2', 
      title: 'React in 100 Seconds', 
      description: 'Understand the core concepts of React: Components, State, and Props.',
      url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', 
      durationMinutes: 15,
      createdBy: 'u1',
      tags: ['Frontend', 'React', 'JS']
    },
    { 
      id: 'c3', 
      title: 'Site Reliability Engineering in 100 Seconds', 
      description: 'What is SRE? Key concepts like SLIs, SLOs, and Error Budgets explained.',
      url: 'https://www.youtube.com/watch?v=BrFE-9K4hHg', 
      durationMinutes: 15,
      createdBy: 'u2',
      tags: ['Ops', 'SRE', 'Process']
    },
    { 
      id: 'c4', 
      title: 'WebSockets in 100 Seconds', 
      description: 'Learn how WebSockets enable real-time, bidirectional communication between clients and servers.',
      url: 'https://www.youtube.com/watch?v=UBUNrFtufWo', 
      durationMinutes: 15,
      createdBy: 'u3',
      tags: ['Web', 'Network', 'Realtime']
    }
  ],
  bookings: [],
  admin: { oauthUrl: '' }
};

// Helper to read DB
const readDb = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
        return defaultDb;
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
};

// Helper to write DB
const writeDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- ROUTES ---

// GET Users
app.get('/api/users', (req, res) => {
    const db = readDb();
    res.json(db.users);
});

// GET Courses
app.get('/api/courses', (req, res) => {
    const db = readDb();
    res.json(db.courses);
});

// POST Course
app.post('/api/courses', (req, res) => {
    const db = readDb();
    const newCourse = req.body;
    db.courses.push(newCourse);
    writeDb(db);
    res.json(newCourse);
});

// GET Bookings
app.get('/api/bookings', (req, res) => {
    const db = readDb();
    res.json(db.bookings);
});

// POST Booking
app.post('/api/bookings', (req, res) => {
    const db = readDb();
    const newBooking = req.body;
    db.bookings.push(newBooking);
    writeDb(db);
    res.json(newBooking);
});

// DELETE Booking
app.delete('/api/bookings/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    db.bookings = db.bookings.filter(b => b.id !== id);
    writeDb(db);
    res.json({ success: true });
});

// GET Admin Settings
app.get('/api/admin/settings', (req, res) => {
    const db = readDb();
    res.json(db.admin || {});
});

// POST Admin Settings
app.post('/api/admin/settings', (req, res) => {
    const db = readDb();
    db.admin = req.body;
    writeDb(db);
    res.json(db.admin);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});