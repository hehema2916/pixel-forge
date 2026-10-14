/* ============================================================
   像素工坊 PixelForge · 迷你真实后端（零依赖 Node.js）
   功能：静态文件服务 + JSON API（资源 / 验证码 / 登录 / 健康检查）
   运行：node server.js  →  http://localhost:8899
   说明：内存存储（重启重置），仅用于演示"前端 → 真实接口"的完整链路
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 8899;
const VERSION = '0.2.0';

/* ---------- “内存数据库” ---------- */
const resources = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/resources.json'), 'utf8'));
const codes = new Map(); // phone -> { code, expires }
const users = new Map(); // phone -> { name, phone, token }

/* ---------- 工具 ---------- */
function sendJSON(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
const ok = (res, data, msg) => sendJSON(res, 200, { code: 0, msg: msg || 'ok', data });
const fail = (res, msg, code) => sendJSON(res, 200, { code: code || 1, msg: msg, data: null });

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve({}); }
    });
  });
}

/* ---------- 静态文件 ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.wasm': 'application/wasm',
};

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ---------- API ---------- */
async function handleAPI(req, res, pathname, query) {
  /* 健康检查 */
  if (pathname === '/api/health' && req.method === 'GET') {
    return ok(res, {
      status: 'up', version: VERSION,
      uptime: Math.round(process.uptime()) + 's',
      time: new Date().toISOString(),
    });
  }

  /* 资源列表（支持分类/搜索） */
  if (pathname === '/api/resources' && req.method === 'GET') {
    let items = resources.slice();
    const cat = (query.get('cat') || '').trim();
    const q = (query.get('q') || '').trim().toLowerCase();
    if (cat && cat !== '全部') items = items.filter((it) => it.cat === cat);
    if (q) items = items.filter((it) => it.title.toLowerCase().includes(q));
    return ok(res, items, '共 ' + items.length + ' 条');
  }

  /* 发送验证码（演示：随机码，直接放在返回消息里） */
  if (pathname === '/api/auth/code' && req.method === 'POST') {
    const body = await readBody(req);
    const phone = String(body.phone || '');
    if (!/^1\d{10}$/.test(phone)) return fail(res, '手机号格式不正确');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    codes.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
    console.log('[auth] 验证码 ' + phone + ' -> ' + code);
    return ok(res, { ttl: 300 }, '验证码已发送（演示环境请填 ' + code + '）');
  }

  /* 登录（演示：校验验证码，签发 token） */
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readBody(req);
    const phone = String(body.phone || '');
    const code = String(body.code || '');
    if (!/^1\d{10}$/.test(phone)) return fail(res, '手机号格式不正确');
    const rec = codes.get(phone);
    if (!rec || rec.expires < Date.now()) return fail(res, '验证码已过期，请重新获取');
    if (rec.code !== code) return fail(res, '验证码不正确（演示环境请看获取时返回的提示）');
    codes.delete(phone);
    let user = users.get(phone);
    if (!user) {
      user = {
        name: '设计师' + phone.slice(-4),
        phone: phone,
        token: crypto.randomBytes(16).toString('hex'),
        createdAt: Date.now(),
      };
      users.set(phone, user);
    }
    console.log('[auth] 登录成功 ' + phone);
    return ok(res, { token: user.token, user: { name: user.name, phone: user.phone } }, '登录成功');
  }

  return sendJSON(res, 404, { code: 404, msg: 'API 不存在', data: null });
}

/* ---------- 服务器 ---------- */
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = u.pathname;
  console.log(req.method + ' ' + pathname);
  if (pathname.startsWith('/api/')) return handleAPI(req, res, pathname, u.searchParams);
  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log('==============================================');
  console.log(' 像素工坊后端已启动 → http://localhost:' + PORT);
  console.log(' API: /api/health  /api/resources');
  console.log('      /api/auth/code (POST)  /api/auth/login (POST)');
  console.log('==============================================');
});
