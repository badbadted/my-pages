#!/usr/bin/env node
// Regenerate reports/index.html by scanning reports/daily/
// Called by auto-crawl.ps1 / auto-crawl-opensource.ps1 after new reports land.
const fs = require('fs');
const path = require('path');

const reportsDir = __dirname;
const dailyDir = path.join(reportsDir, 'daily');
const indexFile = path.join(reportsDir, 'index.html');

const typeMap = {
  'daily-report':      { label: 'Tech',        icon: '📘', group: 'daily',  color: '#3b82f6' },
  'app-report':        { label: 'App',         icon: '📱', group: 'daily',  color: '#10b981' },
  'news-report':       { label: 'News',        icon: '📰', group: 'daily',  color: '#f59e0b' },
  'opensource-report': { label: 'Open Source', icon: '🌐', group: 'weekly', color: '#8b5cf6' },
};

if (!fs.existsSync(dailyDir)) {
  console.error('daily dir not found:', dailyDir);
  process.exit(1);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const files = fs.readdirSync(dailyDir)
  .filter(f => f.endsWith('.html'))
  .map(fn => {
    const m = fn.match(/^(\d{4}-\d{2}-\d{2})_(.+)\.html$/);
    if (!m) return null;
    const [, date, type] = m;
    const meta = typeMap[type];
    if (!meta) return null;
    let title = '';
    try {
      const content = fs.readFileSync(path.join(dailyDir, fn), 'utf8');
      const tm = content.match(/<title>([\s\S]*?)<\/title>/i);
      if (tm) title = tm[1].trim();
    } catch {}
    if (!title) title = `${meta.label} Report — ${date}`;
    return { date, type, ...meta, title, fileName: fn };
  })
  .filter(Boolean);

const daily = files.filter(f => f.group === 'daily').sort((a, b) => b.date.localeCompare(a.date));
const weekly = files.filter(f => f.group === 'weekly').sort((a, b) => b.date.localeCompare(a.date));
const total = files.length;
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const lastUpdate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

// Group daily by date
const dailyByDate = {};
for (const f of daily) {
  (dailyByDate[f.date] ||= []).push(f);
}
const dailyDates = Object.keys(dailyByDate).sort((a, b) => b.localeCompare(a));

const dailyHtml = dailyDates.length === 0
  ? '<div class="empty">尚無報告</div>'
  : dailyDates.map(d => `
    <div class="date-group">
      <div class="date-label">${d}</div>
      <div class="cards">
        ${dailyByDate[d].map(f => `
          <a class="card" data-type="${f.type}" href="daily/${esc(f.fileName)}">
            <span class="card-badge" style="background:${f.color}">${f.icon} ${f.label}</span>
            <div class="card-title">${esc(f.title)}</div>
          </a>`).join('')}
      </div>
    </div>`).join('');

const weeklyHtml = weekly.length === 0
  ? '<div class="empty">尚無週報</div>'
  : `<div class="cards">${weekly.map(f => `
      <a class="card" data-type="${f.type}" href="daily/${esc(f.fileName)}">
        <span class="card-badge" style="background:${f.color}">${f.icon} ${f.label} · ${f.date}</span>
        <div class="card-title">${esc(f.title)}</div>
      </a>`).join('')}</div>`;

const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>📊 每日 AI 報告 — Ted's Reports</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, "Segoe UI", "Noto Sans TC", sans-serif; background: linear-gradient(180deg, #f7f8fa 0%, #eef2ff 100%); color: #1f2937; min-height: 100vh; padding: 32px 20px; }
.container { max-width: 960px; margin: 0 auto; }
header { text-align: center; margin-bottom: 36px; }
h1 { font-size: 32px; color: #0f172a; margin-bottom: 8px; }
.subtitle { color: #64748b; font-size: 15px; }
.stats { display: inline-flex; gap: 20px; margin-top: 14px; padding: 10px 20px; background: #ffffff; border-radius: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 13px; color: #475569; }
.stats b { color: #1e40af; }
.tabs { display: flex; gap: 8px; margin: 28px 0 20px; flex-wrap: wrap; justify-content: center; }
.tab { padding: 10px 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; cursor: pointer; font-size: 14px; font-weight: 600; color: #475569; transition: all 0.2s; }
.tab:hover { background: #f1f5f9; }
.tab.active { background: #3b82f6; color: white; border-color: #3b82f6; }
section { margin-bottom: 40px; }
h2 { font-size: 20px; color: #1e40af; margin-bottom: 16px; padding-left: 12px; border-left: 4px solid #3b82f6; }
.date-group { margin-bottom: 24px; }
.date-label { font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 10px; letter-spacing: 1px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; text-decoration: none; color: inherit; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: block; }
.card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(59,130,246,0.15); border-color: #93c5fd; }
.card-badge { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; color: white; margin-bottom: 10px; }
.card-title { font-size: 15px; font-weight: 600; color: #0f172a; line-height: 1.5; }
.empty { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }
footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
.hidden { display: none !important; }
</style>
</head>
<body>
<div class="container">
<header>
  <h1>📊 每日 AI 報告</h1>
  <p class="subtitle">Tech · App · News 每日更新，Open Source 週報每週六</p>
  <div class="stats">共 <b>${total}</b> 份報告 · 最後更新 <b>${lastUpdate}</b></div>
</header>

<div class="tabs">
  <button class="tab active" data-filter="all">全部</button>
  <button class="tab" data-filter="daily-report">📘 Tech</button>
  <button class="tab" data-filter="app-report">📱 App</button>
  <button class="tab" data-filter="news-report">📰 News</button>
  <button class="tab" data-filter="opensource-report">🌐 Open Source</button>
</div>

<section id="daily-section">
  <h2>每日報告</h2>
  ${dailyHtml}
</section>

<section id="weekly-section">
  <h2>每週 Open Source 報告</h2>
  ${weeklyHtml}
</section>

<footer>由排程自動產出 · <a href="../" style="color:#3b82f6;text-decoration:none">← 回首頁</a></footer>
</div>

<script>
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', e => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  e.target.classList.add('active');
  const f = e.target.dataset.filter;
  document.querySelectorAll('.card').forEach(c => {
    c.classList.toggle('hidden', f !== 'all' && c.dataset.type !== f);
  });
  document.querySelectorAll('.date-group').forEach(g => {
    const visible = g.querySelectorAll('.card:not(.hidden)').length;
    g.classList.toggle('hidden', visible === 0);
  });
  const dailySec = document.getElementById('daily-section');
  const weeklySec = document.getElementById('weekly-section');
  if (f === 'opensource-report') { dailySec.classList.add('hidden'); weeklySec.classList.remove('hidden'); }
  else if (f === 'all') { dailySec.classList.remove('hidden'); weeklySec.classList.remove('hidden'); }
  else { dailySec.classList.remove('hidden'); weeklySec.classList.add('hidden'); }
}));
</script>
</body>
</html>`;

fs.writeFileSync(indexFile, html, 'utf8');
console.log(`Index regenerated: ${indexFile} (${total} reports)`);
