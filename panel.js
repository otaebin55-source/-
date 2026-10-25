// panel.js
// 실행: node panel.js
// 접속: http://서버IP:3847
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3847;
const ROOT = __dirname;
const CONFIG = path.join(ROOT, 'config.json');
const BOT = path.join(ROOT, 'selfbot.js');

let botProc = null;

function load() {
  try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); }
  catch {
    return { token: '', prefix: '.', ownerTokens: {}, boostTokens: [] };
  }
}
function save(c) {
  fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2));
}

function restartBot() {
  if (botProc) {
    try { botProc.kill('SIGTERM'); } catch {}
    botProc = null;
  }
  const c = load();
  if (!c.token) return { ok: false, msg: '메인 토큰 없음' };

  botProc = spawn(process.execPath, [BOT], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, DISCORD_TOKEN: c.token, CMD_PREFIX: c.prefix || '.' }
  });
  botProc.on('exit', code => {
    console.log('[panel] bot exit', code);
    botProc = null;
  });
  return { ok: true, msg: '봇 재시작됨 PID ' + botProc.pid };
}

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>흑룡회 † Token Panel</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:#e0e0e0;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
.panel{background:#12121a;border:1px solid #2a2a3a;border-radius:14px;padding:2rem;width:100%;max-width:520px;box-shadow:0 0 50px rgba(124,58,237,.18)}
h1{font-size:1.45rem;color:#c084fc;letter-spacing:1px;margin-bottom:.3rem}
.sub{font-size:.82rem;color:#777;margin-bottom:1.3rem}
label{display:block;font-size:.78rem;color:#999;margin-bottom:.35rem}
input,textarea{width:100%;background:#1a1a24;border:1px solid #333;border-radius:8px;padding:.75rem 1rem;color:#fff;font-size:.92rem;margin-bottom:.9rem}
textarea{min-height:100px;resize:vertical;font-family:monospace;font-size:.8rem}
input:focus,textarea:focus{outline:none;border-color:#c084fc}
button{width:100%;background:linear-gradient(135deg,#7c3aed,#a855f7);border:none;border-radius:8px;padding:.9rem;color:#fff;font-weight:600;cursor:pointer;font-size:.95rem}
button:hover{opacity:.92}button:disabled{opacity:.45;cursor:not-allowed}
.status{margin-top:.8rem;padding:.75rem;border-radius:8px;font-size:.84rem;display:none}
.status.ok{background:#0f2a1a;color:#4ade80;display:block}
.status.err{background:#2a0f0f;color:#f87171;display:block}
.status.info{background:#1a1a2a;color:#a5b4fc;display:block}
.hint{font-size:.72rem;color:#555;margin-top:1rem;line-height:1.5}
code{background:#1a1a24;padding:1px 5px;border-radius:4px;font-size:.7rem}
</style>
</head>
<body>
<div class="panel">
  <h1>흑룡회 † 黑龍</h1>
  <p class="sub">메인 토큰 + 부스트 토큰 · 저장하면 봇 자동 재시작</p>

  <label>메인 Discord User Token (봇 로그인용)</label>
  <input type="password" id="token" placeholder="mfa.xxx 또는 일반 토큰" autocomplete="off">

  <label>부스트용 토큰들 (한 줄에 하나 · 니트로/부스트 있는 계정)</label>
  <textarea id="boostTokens" placeholder="토큰1&#10;토큰2&#10;토큰3"></textarea>

  <label>명령 접두사</label>
  <input type="text" id="prefix" value="." maxlength="5">

  <button id="btn">저장 & 봇 재시작</button>
  <div id="st" class="status"></div>

  <p class="hint">
    1. 메인 토큰 넣고 저장 → 봇 켜짐<br>
    2. 부스트 토큰은 <code>.부스트봇 3</code> 할 때 사용<br>
    3. 토큰 무효화되면 여기 다시 넣고 저장하면 끝
  </p>
</div>
<script>
const st=document.getElementById('st'),btn=document.getElementById('btn');
function show(t,m){st.className='status '+t;st.textContent=m}
btn.onclick=async()=>{
  const token=document.getElementById('token').value.trim();
  const prefix=document.getElementById('prefix').value.trim()||'.';
  const boostRaw=document.getElementById('boostTokens').value.trim();
  const boostTokens=boostRaw?boostRaw.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean):[];
  if(!token){show('err','메인 토큰 넣어라');return}
  btn.disabled=true;show('info','저장 중...');
  try{
    const r=await fetch('/api/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,prefix,boostTokens})});
    const d=await r.json();
    show(d.ok?'ok':'err',d.msg||'완료');
    if(d.ok){document.getElementById('token').value='';document.getElementById('boostTokens').value='';}
  }catch(e){show('err','연결 실패: '+e.message)}
  finally{btn.disabled=false}
};
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/index'))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/token') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { token, prefix, boostTokens } = JSON.parse(body);
        if (!token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, msg: '메인 토큰 필요' }));
          return;
        }
        const c = load();
        c.token = String(token).trim();
        c.prefix = (prefix || '.').trim();
        if (Array.isArray(boostTokens)) {
          c.boostTokens = boostTokens.map(t => String(t).trim()).filter(Boolean);
        }
        save(c);
        const result = restartBot();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, msg: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('nope');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('[panel] http://0.0.0.0:' + PORT);
  if (load().token) restartBot();
});
