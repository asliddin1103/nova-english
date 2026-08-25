const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, 'backend', '.env');

function updateEnv(newUrl) {
  let content = fs.readFileSync(ENV_PATH, 'utf8');

  if (content.includes('MINI_APP_URL=')) {
    content = content.replace(/MINI_APP_URL=.*/g, `MINI_APP_URL=${newUrl}`);
  } else {
    content += `\nMINI_APP_URL=${newUrl}`;
  }

  fs.writeFileSync(ENV_PATH, content, 'utf8');
  console.log('\n✅ .env avtomatik yangilandi!');
  console.log(`📱 MINI_APP_URL=${newUrl}`);
  console.log('🔄 Backend avtomatik qayta ishga tushadi...\n');
}

console.log('🚇 Cloudflare tunnel ishga tushmoqda...\n');

const cf = spawn('.\\cloudflared.exe', ['tunnel', '--url', 'http://localhost:5173'], {
  stdio: ['inherit', 'pipe', 'pipe'],
});

let urlFound = false;

function parseUrl(data) {
  const text = data.toString();
  process.stdout.write(text);

  if (!urlFound) {
    // faqat haqiqiy tunnel URLlarni tutib olish (masalan: abc-xyz-123.trycloudflare.com)
    const match = text.match(/https:\/\/[a-z0-9][a-z0-9\-]+[a-z0-9]\.trycloudflare\.com(?!\/)/)
    if (match && !match[0].includes('api.trycloudflare')) {
      urlFound = true;
      updateEnv(match[0]);
    }
  }
}

cf.stdout.on('data', parseUrl);
cf.stderr.on('data', parseUrl);

cf.on('close', (code) => {
  console.log(`\n🔴 Tunnel to'xtatildi (exit code: ${code})`);
});
