const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

const DEFAULT_STATE = {
  accounts: { metehan: 1500, mustafa: 750, remzi: 200, suna: 0, ahmet: 3200 },
  passwords: {},
  history: [],
  currentUser: null,
  isAdmin: false,
  counter: 0,
  adminPass: "admin123",
  showPasswords: false,
  basvurular: [],
  ilanlar: [],
  plakalar: {},
  vezne: [],
  favorites: [],
  duyuru: "Sistem egitim demosu olarak calisir.",
  vergi: {},
  sgkPrim: {},
  mulkler: {},
  texts: {},
  sonFis: ""
};

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function writeState(data) {
  data.currentUser = null;
  data.isAdmin = false;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(obj));
}

function findFile(urlPath) {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0]);
  const name = clean === "/" ? "index.html" : clean.replace(/^\//, "");
  const candidates = [
    path.join(ROOT, "public", name),
    path.join(ROOT, name)
  ];
  for (const f of candidates) {
    try {
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
    } catch (e) {}
  }
  return null;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".css": "text/css; charset=utf-8"
};

http.createServer((req, res) => {
  if ((req.url || "").startsWith("/api/state")) {
    if (req.method === "GET") return sendJson(res, 200, readState());
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => {
        try {
          writeState(JSON.parse(body));
          sendJson(res, 200, { success: true });
        } catch {
          sendJson(res, 400, { success: false });
        }
      });
      return;
    }
    res.writeHead(405);
    return res.end();
  }

  const file = findFile(req.url);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not Found: " + (req.url || "/"));
  }

  const data = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  res.end(data);
}).listen(PORT, "0.0.0.0", () => {
  console.log("MeteBank calisiyor:" + PORT);
  console.log("public/index?", fs.existsSync(path.join(ROOT, "public", "index.html")));
});
