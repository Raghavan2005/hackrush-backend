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
   FILE PATHS
========================= */

const DATA_DIR = path.join(__dirname, "data");
const USERS_DB = path.join(DATA_DIR, "users.json");
const SESSIONS_DB = path.join(DATA_DIR, "sessions.json");
const LOGIN_LOG = path.join(DATA_DIR, "logins.json");
const CONFIG_DB = path.join(DATA_DIR, "config.json");

/* =========================
   INIT FILE SYSTEM
========================= */

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const ensureFile = (file, defaultValue) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
  }
};

ensureFile(USERS_DB, []);
ensureFile(SESSIONS_DB, []);
ensureFile(LOGIN_LOG, []);
ensureFile(CONFIG_DB, { loginEnabled: true });

/* =========================
   SAFE JSON HELPERS
========================= */

const readJson = (file, fallback) => {
  try {
    const data = fs.readFileSync(file, "utf8");
    if (!data.trim()) return fallback;
    return JSON.parse(data);
  } catch {
    return fallback;
  }
};

const writeJson = (file, data) => {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
};

/* =========================
   AUTH MIDDLEWARE
========================= */

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "No token" });
  }

  const token = header.split(" ")[1];
  const sessions = readJson(SESSIONS_DB, []);

  const session = sessions.find(s => s.token === token);
  if (!session) {
    return res.status(401).json({ message: "Invalid session" });
  }

  req.teamCode = session.teamCode;
  next();
}

/* =========================
   LOGIN
========================= */

app.post("/api/auth/login", (req, res) => {
  const { teamCode, passcode } = req.body;

  if (!teamCode || !passcode) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const config = readJson(CONFIG_DB, { loginEnabled: true });
  if (!config.loginEnabled) {
    return res.status(403).json({ message: "Login disabled" });
  }

  const users = readJson(USERS_DB, []);
  const user = users.find(
    u => u.teamCode === teamCode && u.passcode === passcode
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.active) {
    return res.status(403).json({ message: "Team disabled" });
  }

  let sessions = readJson(SESSIONS_DB, []);
  sessions = sessions.filter(s => s.teamCode !== teamCode);

  const token = crypto.randomUUID();

  sessions.push({
    teamCode,
    token,
    createdAt: new Date().toISOString()
  });

  writeJson(SESSIONS_DB, sessions);

  const logins = readJson(LOGIN_LOG, []);
  logins.push({
    teamCode,
    time: new Date().toISOString(),
    ip: req.ip
  });
  writeJson(LOGIN_LOG, logins);

  res.json({
    success: true,
    token,
    teamName: user.teamName
  });
});

/* =========================
   TEAM INFO (DASHBOARD)
========================= */

app.get("/api/team/me", auth, (req, res) => {
  const users = readJson(USERS_DB, []);
  const user = users.find(u => u.teamCode === req.teamCode);

  if (!user) {
    return res.status(404).json({ message: "Team not found" });
  }

  // 🚫 HARD GATE: Problem not selected
  if (!user.problemStatement) {
    return res.status(403).json({
      message: "Problem statement not selected",
      code: "PROBLEM_NOT_SELECTED"
    });
  }

  // ✅ Allowed to access dashboard
  res.json({
    teamName: user.teamName,
    hasSpun: user.hasSpun,
    reward: user.reward,
    problemStatement: user.problemStatement
  });
});


/* =========================
   SPIN WHEEL (ONE TIME)
========================= */

app.post("/api/spin", auth, (req, res) => {
  const users = readJson(USERS_DB, []);
  const index = users.findIndex(
    u => u.teamCode === req.teamCode
  );

  if (index === -1) {
    return res.status(404).json({ message: "Team not found" });
  }

  if (users[index].hasSpun) {
    return res.status(400).json({ message: "Spin already used" });
  }

const rewards = [
  "Email/SMTP Integration",
  "Export to PDF/CSV Functionality",
  "AI Chatbot/Assistant Interface",
  "Dark Mode & Accessibility Toggle",
  "Data Visualization Dashboard",
  "Push Notification System",
  "User Feedback/Rating System",
  "Voice-to-Text Integration",
  "Multi-Language Support (i18n)",
  "Real-time Collaboration (Sockets)",
  "Social Media Auth (Google/GitHub)",
  "PWA (Installable Mobile App)"
];


  const reward =
    rewards[Math.floor(Math.random() * rewards.length)];

  users[index].hasSpun = true;
  users[index].reward = reward;

  writeJson(USERS_DB, users);

  res.json({ reward });
});

  const PROBLEMS_DB = path.join(DATA_DIR, "problems.json");
ensureFile(PROBLEMS_DB, []);

app.get("/api/problems", auth, (req, res) => {
  const problems = readJson(PROBLEMS_DB, []);

  const available = problems.map(p => ({
    id: p.id,
    title: p.title,
    remaining: p.limit - p.selectedTeams.length
  }));

  res.json(available);
});


app.post("/api/problems/select", auth, (req, res) => {
  const { problemId } = req.body;

  const users = readJson(USERS_DB, []);
  const problems = readJson(PROBLEMS_DB, []);

  const userIndex = users.findIndex(u => u.teamCode === req.teamCode);
  if (userIndex === -1) {
    return res.status(404).json({ message: "Team not found" });
  }

  if (users[userIndex].problemStatement) {
    return res.status(400).json({ message: "Problem already selected" });
  }

  const problem = problems.find(p => p.id === problemId);
  if (!problem) {
    return res.status(404).json({ message: "Problem not found" });
  }

  if (problem.selectedTeams.length >= problem.limit) {
    return res.status(409).json({ message: "Problem statement full" });
  }

  // Assign
  problem.selectedTeams.push(req.teamCode);
  users[userIndex].problemStatement = problemId;

  writeJson(PROBLEMS_DB, problems);
  writeJson(USERS_DB, users);

  res.json({ success: true });
});
/* =========================
   ADMIN: LOGIN LOCK
========================= */

app.post("/api/admin/login-lock", (req, res) => {
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    return res.status(400).json({
      message: "enabled must be boolean"
    });
  }

  writeJson(CONFIG_DB, { loginEnabled: enabled });

  res.json({
    success: true,
    loginEnabled: enabled
  });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
