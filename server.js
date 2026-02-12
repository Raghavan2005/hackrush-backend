const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

/* =========================
   FILE PATHS & INIT
========================= */
const DATA_DIR = path.join(__dirname, "data");
const USERS_DB = path.join(DATA_DIR, "users.json");
const SESSIONS_DB = path.join(DATA_DIR, "sessions.json");
const CONFIG_DB = path.join(DATA_DIR, "config.json");
const PROBLEMS_DB = path.join(DATA_DIR, "problems.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const ensureFile = (file, defaultValue) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
  }
};

// Initialize Problems with your provided data
const initialProblems = [
  { "id": "PS-01", "title": "Fake Job & Recruitment Scam Detection", "limit": 2, "selectedTeams": [] },
  { "id": "PS-02", "title": "Everyday Carbon Savings Tracker", "limit": 2, "selectedTeams": [] },
  { "id": "PS-03", "title": "Meeting Notes Action Item Extractor", "limit": 2, "selectedTeams": [] },
  { "id": "PS-04", "title": "Digital Reputation Score for SMBs", "limit": 2, "selectedTeams": [] },
  { "id": "PS-05", "title": "Parking Spot Memory Helper", "limit": 2, "selectedTeams": [] },
  { "id": "PS-06", "title": "Digital Footprint Analyzer", "limit": 2, "selectedTeams": [] },
  { "id": "PS-07", "title": "P2P Skill Swap Credits Platform", "limit": 2, "selectedTeams": [] },
  { "id": "PS-08", "title": "Inclusive Navigation & Safety Assistant", "limit": 2, "selectedTeams": [] },
  { "id": "PS-09", "title": "Smart Email & Notification Prioritizer", "limit": 2, "selectedTeams": [] },
  { "id": "PS-10", "title": "Real-Time Financial Stress Detection", "limit": 2, "selectedTeams": [] },
  { "id": "PS-11", "title": "Sustainable Product Recommender", "limit": 2, "selectedTeams": [] },
  { "id": "PS-12", "title": "Shared Grocery Shopping Optimizer", "limit": 2, "selectedTeams": [] },
  { "id": "PS-13", "title": "Digital Consent & Transparency Platform", "limit": 2, "selectedTeams": [] },
  { "id": "PS-14", "title": "Local Event Discovery for Introverts", "limit": 2, "selectedTeams": [] },
  { "id": "PS-15", "title": "GenAI-Powered Financial Assistant", "limit": 2, "selectedTeams": ["DEMO1"] },
  { "id": "PS-16", "title": "E-Waste & Carbon Lifecycle Tracker", "limit": 2, "selectedTeams": [] },
  { "id": "PS-17", "title": "CropTrack: Pasture Biomass Intelligence", "limit": 2, "selectedTeams": [] },
  { "id": "PS-18", "title": "BrightPath: Glaucoma Monitoring", "limit": 2, "selectedTeams": [] },
  { "id": "PS-19", "title": "ECG Restore: Heart Signal Digitization", "limit": 2, "selectedTeams": [] },
  { "id": "PS-20", "title": "Gamified Investment Coach for Students", "limit": 2, "selectedTeams": [] }
];

const ADMIN_USER = "bicadmin";
const ADMIN_PASS = "hackrush2026"; // Change this to your desired password
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Access"');
    return res.status(401).send("Authentication required");
  }

  // Decode the Base64 string (user:pass)
  const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
  const user = auth[0];
  const pass = auth[1];

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Access"');
    return res.status(401).send("Invalid credentials");
  }
}
app.get("/penkuti", adminAuth, (req, res) => {
  const users = readJson(USERS_DB, []);
  const problems = readJson(PROBLEMS_DB, []);
  const config = readJson(CONFIG_DB, { loginEnabled: false });

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hackathon Command Center</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); }
      </style>
    </head>
    <body class="bg-slate-50 text-slate-900 antialiased">

      <div class="min-h-screen p-4 md:p-8">
        <div class="max-w-7xl mx-auto">
          
          <header class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 glass sticky top-4 z-50">
            <div>
              <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span class="bg-indigo-600 text-white p-1.5 rounded-lg"><i class="fa-solid fa-terminal text-sm"></i></span>
                Hackrush <span class="text-indigo-600 font-light">v69</span>
              </h1>
              <p class="text-slate-500 text-xs mt-1 font-medium uppercase tracking-wider">
                ${users.length} Teams Registered • ${problems.length} Problem Statements
              </p>
            </div>
            
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold ${config.loginEnabled ? 'text-green-600' : 'text-red-600'}">
                System: ${config.loginEnabled ? 'LIVE' : 'LOCKED'}
              </span>
              <button onclick="apiCall('/api/admin/login-lock', {enabled: ${!config.loginEnabled}})" 
                class="px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-indigo-100 ${config.loginEnabled ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-600 text-white hover:bg-green-700'}">
                <i class="fa-solid ${config.loginEnabled ? 'fa-lock' : 'fa-lock-open'} mr-2"></i>
                ${config.loginEnabled ? 'Disable Logins' : 'Enable Logins'}
              </button>
            </div>
          </header>

          <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            <div class="lg:col-span-3 space-y-6">
              
              <section class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4"><i class="fa-solid fa-plus-circle mr-2"></i>Register New Team</h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input id="n" type="text" placeholder="Team Name" class="bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <input id="c" type="text" placeholder="Team ID (Code)" class="bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono">
                  <input id="p" type="text" placeholder="Passcode" class="bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <button onclick="addTeam()" class="bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors">Add Team</button>
                </div>
              </section>

              <section class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 class="font-bold text-slate-800">Team Roster</h2>
                  <div class="flex gap-2">
                    <div class="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span class="text-xs font-bold text-slate-400">Real-time Updates</span>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="text-slate-400 text-[11px] uppercase tracking-widest bg-slate-50/50">
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Team Info</th>
                        <th class="px-6 py-4">Selected PS</th>
                        <th class="px-6 py-4">Reward</th>
                        <th class="px-6 py-4 text-right">Controls</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${users.map(u => `
                        <tr class="hover:bg-slate-50/50 transition-colors ${!u.active ? 'opacity-40 grayscale' : ''}">
                          <td class="px-6 py-4">
                            <span class="h-2.5 w-2.5 rounded-full inline-block ${u.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}"></span>
                          </td>
                          <td class="px-6 py-4">
                            <div class="font-bold text-slate-800">${u.teamName}</div>
                            <div class="text-[10px] font-mono text-indigo-500 bg-indigo-50 inline-block px-1.5 py-0.5 rounded italic mt-1">${u.teamCode} • ${u.passcode}</div>
                          </td>
                          <td class="px-6 py-4">
                            ${u.problemStatement ? `<span class="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600 border border-slate-200">${u.problemStatement}</span>` : '<span class="text-xs text-slate-300 italic underline decoration-dotted">No Selection</span>'}
                          </td>
                          <td class="px-6 py-4 text-xs font-bold text-indigo-600">${u.reward || '—'}</td>
                          <td class="px-6 py-4 text-right space-x-1">
                            <button onclick="apiCall('/api/admin/team/reset-ps', {teamCode: '${u.teamCode}'})" title="Reset Problem" class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><i class="fa-solid fa-arrow-rotate-left"></i></button>
                            <button onclick="apiCall('/api/admin/team/reset-spin', {teamCode: '${u.teamCode}'})" title="Reset Spin" class="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all"><i class="fa-solid fa-dharmachakra"></i></button>
                            <button onclick="apiCall('/api/admin/team/toggle', {teamCode: '${u.teamCode}'})" class="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"><i class="fa-solid ${u.active ? 'fa-user-slash' : 'fa-user-check'}"></i></button>
                            <button onclick="if(confirm('Delete Team?')) apiCall('/api/admin/team/delete', {teamCode: '${u.teamCode}'})" class="p-2 text-slate-300 hover:text-red-500 transition-all"><i class="fa-solid fa-trash-can"></i></button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside class="space-y-6">
              <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Slot Availability</h2>
                <div class="space-y-5">
                  ${problems.map(p => {
                    const ratio = p.selectedTeams.length / p.limit;
                    const color = ratio >= 1 ? 'bg-red-500' : ratio > 0.5 ? 'bg-orange-400' : 'bg-indigo-500';
                    return `
                    <div class="group">
                      <div class="flex justify-between text-[11px] mb-1.5">
                        <span class="font-bold text-slate-700">${p.id}</span>
                        <span class="font-mono ${ratio >= 1 ? 'text-red-500 font-black' : 'text-slate-400'}">${p.selectedTeams.length}/${p.limit}</span>
                      </div>
                      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-50">
                        <div class="h-full ${color} transition-all duration-700 ease-out shadow-sm" style="width: ${ratio * 100}%"></div>
                      </div>
                    </div>`;
                  }).join('')}
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>

      <script>
        async function apiCall(endpoint, data) {
          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(data)
            });
            if(res.ok) location.reload();
          } catch (err) { alert('Action failed'); }
        }

        function addTeam() {
          const teamName = document.getElementById('n').value;
          const teamCode = document.getElementById('c').value;
          const passcode = document.getElementById('p').value;
          if(!teamName || !teamCode || !passcode) return alert('Fill all fields');
          apiCall('/api/admin/team/add', { teamName, teamCode, passcode });
        }
      </script>
    </body>
    </html>
  `);
});

ensureFile(USERS_DB, []);
ensureFile(SESSIONS_DB, []);
ensureFile(CONFIG_DB, { loginEnabled: true });
ensureFile(PROBLEMS_DB, initialProblems);

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
};

const writeJson = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};
const ADMIN_USERSUPER = "superadmin";
const ADMIN_PASSSUPER = "superhackrush2026"; // Change this to your desired password

function superadminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Access"');
    return res.status(401).send("Super Authentication required");
  }

  // Decode the Base64 string (user:pass)
  const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
  const user = auth[0];
  const pass = auth[1];

  if (user === ADMIN_USERSUPER && pass === ADMIN_PASSSUPER) {
    next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Access"');
    return res.status(401).send("Invalid credentials");
  }
}
/* =========================
   AUTH MIDDLEWARE
========================= */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];
  const sessions = readJson(SESSIONS_DB, []);
  const session = sessions.find(s => s.token === token);

  if (!session) return res.status(401).json({ message: "Invalid session" });

  req.teamCode = session.teamCode;
  next();
}
/* =========================
   FIXED ADMIN ROUTES
========================= */

// 1. Add Team
app.post("/api/admin/team/add",adminAuth, (req, res) => {
  const { teamName, teamCode, passcode } = req.body;
  const users = readJson(USERS_DB, []);
  users.push({
    teamName,
    teamCode,
    passcode,
    active: true,
    hasSpun: false,
    reward: null,
    problemStatement: null
  });
  writeJson(USERS_DB, users);
  res.json({ success: true });
});

// 2. Toggle Active Status
app.post("/api/admin/team/toggle",adminAuth, (req, res) => {
  const { teamCode } = req.body;
  const users = readJson(USERS_DB, []);
  const user = users.find(u => u.teamCode === teamCode);
  if (user) user.active = !user.active;
  writeJson(USERS_DB, users);
  res.json({ success: true });
});

// 3. Reset Problem Statement
app.post("/api/admin/team/reset-ps",superadminAuth, (req, res) => {
  const { teamCode } = req.body;
  const users = readJson(USERS_DB, []);
  const problems = readJson(PROBLEMS_DB, []);
  const user = users.find(u => u.teamCode === teamCode);

  if (user && user.problemStatement) {
    const p = problems.find(x => x.id === user.problemStatement);
    if (p) p.selectedTeams = p.selectedTeams.filter(t => t !== teamCode);
    user.problemStatement = null;
    writeJson(USERS_DB, users);
    writeJson(PROBLEMS_DB, problems);
  }
  res.json({ success: true });
});

// 4. Reset Spin
app.post("/api/admin/team/reset-spin",superadminAuth, (req, res) => {
  const { teamCode } = req.body;
  const users = readJson(USERS_DB, []);
  const user = users.find(u => u.teamCode === teamCode);
  if (user) {
    user.hasSpun = false;
    user.reward = null;
  }
  writeJson(USERS_DB, users);
  res.json({ success: true });
});

// 5. Delete Team
app.post("/api/admin/team/delete",superadminAuth, (req, res) => {
  const { teamCode } = req.body;
  let users = readJson(USERS_DB, []);
  users = users.filter(u => u.teamCode !== teamCode);
  writeJson(USERS_DB, users);
  res.json({ success: true });
});

// 6. Login Lock Toggle
app.post("/api/admin/login-lock",adminAuth, (req, res) => {
  const { enabled } = req.body;
  writeJson(CONFIG_DB, { loginEnabled: enabled });
  res.json({ success: true });
});

/* =========================
   AUTH ROUTES
========================= */
app.post("/api/auth/login", (req, res) => {
  const { teamCode, passcode } = req.body;
  const config = readJson(CONFIG_DB, { loginEnabled: true });

  if (!config.loginEnabled) {
    return res.status(403).json({ message: "Login disabled" });
  }

  const users = readJson(USERS_DB, []);
  const user = users.find(
    u => u.teamCode === teamCode && u.passcode === passcode
  );

  if (!user || !user.active) {
    return res.status(401).json({ message: "Invalid or inactive team" });
  }

  const token = crypto.randomUUID();
  let sessions = readJson(SESSIONS_DB, []).filter(s => s.teamCode !== teamCode);
  sessions.push({ teamCode, token, createdAt: new Date().toISOString() });

  writeJson(SESSIONS_DB, sessions);

  res.json({ success: true, token, teamName: user.teamName });
});

/* =========================
   TEAM ROUTES
========================= */
app.get("/api/team/me", auth, (req, res) => {
  const users = readJson(USERS_DB, []);
  const user = users.find(u => u.teamCode === req.teamCode);

  res.json({
    teamName: user.teamName,
    active: user.active,
    hasSpun: user.hasSpun,
    reward: user.reward,
    problemStatement: user.problemStatement
  });
});

/* =========================
   PROBLEM ROUTES
========================= */
app.get("/api/problems", auth, (req, res) => {
  const problems = readJson(PROBLEMS_DB, []);
  res.json(problems.map(p => ({
    id: p.id,
    title: p.title,
    remaining: p.limit - p.selectedTeams.length
  })));
});

app.post("/api/problems/select", auth, (req, res) => {
  const { problemId } = req.body;
  const users = readJson(USERS_DB, []);
  const problems = readJson(PROBLEMS_DB, []);

  const user = users.find(u => u.teamCode === req.teamCode);
  if (user.problemStatement) {
    return res.status(400).json({ message: "Already selected" });
  }

  const problem = problems.find(p => p.id === problemId);
  if (!problem || problem.selectedTeams.length >= problem.limit) {
    return res.status(409).json({ message: "Problem unavailable" });
  }

  problem.selectedTeams.push(req.teamCode);
  user.problemStatement = problemId;

  writeJson(USERS_DB, users);
  writeJson(PROBLEMS_DB, problems);

  res.json({ success: true });
});

/* =========================
   SPIN ROUTE
========================= */
app.post("/api/spin", auth, (req, res) => {
  const users = readJson(USERS_DB, []);
  const user = users.find(u => u.teamCode === req.teamCode);

  if (user.hasSpun) {
    return res.status(400).json({ message: "Already spun" });
  }

  const rewards = [
    "AI Chatbot", "Dark Mode", "PDF Export",
    "Push Notifications", "Voice Input"
  ];

  user.reward = rewards[Math.floor(Math.random() * rewards.length)];
  user.hasSpun = true;

  writeJson(USERS_DB, users);
  res.json({ reward: user.reward });
});

/* =========================
   ADMIN TEAM ACTIONS
========================= */
app.post("/api/admin/team-action", (req, res) => {
  const { teamCode, action } = req.body;

  const users = readJson(USERS_DB, []);
  const problems = readJson(PROBLEMS_DB, []);
  let sessions = readJson(SESSIONS_DB, []);

  const user = users.find(u => u.teamCode === teamCode);
  if (!user) return res.status(404).json({ message: "Team not found" });

  switch (action) {
    case "ACTIVATE":
      user.active = true;
      break;

    case "DEACTIVATE":
      user.active = false;
      sessions = sessions.filter(s => s.teamCode !== teamCode);
      writeJson(SESSIONS_DB, sessions);
      break;

    case "RESET_SPIN":
      user.hasSpun = false;
      user.reward = null;
      break;

    case "RESET_PS":
      if (user.problemStatement) {
        const p = problems.find(x => x.id === user.problemStatement);
        if (p) {
          p.selectedTeams = p.selectedTeams.filter(t => t !== teamCode);
        }
        user.problemStatement = null;
      }
      break;

    case "FULL_RESET":
      user.hasSpun = false;
      user.reward = null;

      if (user.problemStatement) {
        const p = problems.find(x => x.id === user.problemStatement);
        if (p) {
          p.selectedTeams = p.selectedTeams.filter(t => t !== teamCode);
        }
        user.problemStatement = null;
      }

      sessions = sessions.filter(s => s.teamCode !== teamCode);
      writeJson(SESSIONS_DB, sessions);
      break;

    default:
      return res.status(400).json({ message: "Invalid action" });
  }

  writeJson(USERS_DB, users);
  writeJson(PROBLEMS_DB, problems);

  res.json({ success: true, teamCode, action });
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
