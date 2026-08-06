const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// public/index.html varsa public, yoksa kök klasör
const PUBLIC = fs.existsSync(path.join(ROOT, "public", "index.html"))
  ? path.join(ROOT, "public")
  : ROOT;

const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

const DEFAULT_STATE = {
  accounts: {
    metehan: 1500,
    mustafa: 750,
    remzi: 200,
    suna: 0,
    ahmet: 3200
  },
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
  duyuru: "Sistem egitim demosu olarak calisir. Resmi e-Devlet degildir.",
  vergi: {},
  sgkPrim: {},
  mulkler: {},
  texts: {},
  sonFis: ""
};

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STATE, null, 2), "utf8");
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
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function safePath(urlPath) {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0]);
  const requested = clean === "/" ? "/index.html" : clean;
  const file = path.normalize(path.join(PUBLIC, requested));
  if (!file.startsWith(PUBLIC + path.sep) && file !== PUBLIC) return null;
  return file;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  if ((req.url || "").startsWith("/api/state")) {
    if (req.method === "GET") {
      return sendJson(res, 200, readState());
    }
    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 2000000) req.destroy();
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (!data || typeof data !== "object" || Array.isArray(data)) {
            return sendJson(res, 400, { success: false, error: "Gecersiz veri" });
          }
          writeState(data);
          sendJson(res, 200, { success: true });
        } catch (e) {
          sendJson(res, 400, { success: false, error: "JSON okunamadi" });
        }
      });
      return;
    }
    res.writeHead(405);
    return res.end();
  }

  const file = safePath(req.url);
  if (!file) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not Found");
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("MeteBank calisiyor: 0.0.0.0:" + PORT);
  console.log("PUBLIC folder:", PUBLIC);
});
