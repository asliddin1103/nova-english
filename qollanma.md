# 📘 Nova English — Ishga Tushirish Qo'llanmasi

## ⚡ Har Kunlik Ishga Tushirish (2 ta terminal)

### 1-terminal — Hamma serviceslar:
```powershell
cd "c:\Users\asus\Desktop\Loyihalarim\Nova English"
npm run dev
```

### 2-terminal — Telegram Mini App uchun tunnel:
```powershell
cd "c:\Users\asus\Desktop\Loyihalarim\Nova English"
npm run tunnel
```
Chiqgan URLni (masalan `https://abc-xyz.trycloudflare.com`) `backend/.env` ga ko'chiring:
```env
MINI_APP_URL=https://abc-xyz.trycloudflare.com
```
Keyin backendni qayta yoqing (`Ctrl+C` → `npm run dev`).

> ⚠️ **Muhim:** Tunnel har safar yangi URL beradi — har ishga tushirganda `.env` ni yangilash kerak!

---

## 🌐 Manzillar

| Xizmat | Manzil |
|---|---|
| 🖥️ Backend API | http://localhost:3001 |
| 📱 Student App | http://localhost:5173 |
| 🛠️ Admin Panel | http://localhost:5174 |
| 🤖 Telegram Mini App | `MINI_APP_URL` dagi tunnel URL |

---

## 📁 Loyiha Tuzilmasi

```
Nova English/
├── backend/           → Express API + Telegram Bot
├── student-app/       → Talabalar uchun React ilovasi
├── admin-panel/       → Admin boshqaruv paneli
├── cloudflared.exe    → Cloudflare tunnel dasturi
├── package.json       → Root skriptlar (npm run dev)
└── qollanma.md        → Shu fayl 😊
```

---

## 🔧 Birinchi Marta O'rnatish

### 1. Barcha dependencylarni o'rnatish

```powershell
cd "c:\Users\asus\Desktop\Loyihalarim\Nova English"
npm run install:all
```

### 2. `.env` faylini tekshirish

`backend/.env` faylida quyidagilar bo'lishi kerak:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=...
TELEGRAM_BOT_TOKEN=8764083578:AAFoX4...
MINI_APP_URL=https://...
```

### 3. Database migrate qilish (birinchi marta)

```powershell
cd "c:\Users\asus\Desktop\Loyihalarim\Nova English\backend"
npm run db:push
```

---

## 🚀 Har Kunlik Ishga Tushirish

### ✅ Eng oson yo'l (hamma narsani birga)

```powershell
cd "c:\Users\asus\Desktop\Loyihalarim\Nova English"
npm run dev
```

### Alohida-alohida ishga tushirish

| Qism | Buyruq |
|---|---|
| Faqat Backend + Bot | `npm run dev:backend` |
| Faqat Student App | `npm run dev:student` |
| Faqat Admin Panel | `npm run dev:admin` |

> **Eslatma:** Har bir buyruqni `Nova English/` papkasida bajaring.

---

## 🌐 Manzillar

| Xizmat | Manzil |
|---|---|
| 🖥️ Backend API | http://localhost:3001 |
| 📱 Student App | http://localhost:5173 |
| 🛠️ Admin Panel | http://localhost:5174 |
| 🔌 API Health | http://localhost:3001/health |

---

## 🤖 Telegram Bot

Bot **backend server** ichida avtomatik ishga tushadi.

- Backend ishga tushganda konsolda ko'rasiz:
  ```
  🤖 Telegram Bot started and polling for messages...
  ```
- Bot tokeni: `backend/.env` faylidagi `TELEGRAM_BOT_TOKEN`
- Bot ishlashi uchun internet bo'lishi shart

### Bot Buyruqlari

| Buyruq | Natija |
|---|---|
| `/start` | Xush kelibsiz xabari + Mini App tugmasi |
| `💳 Obuna va To'lov` | Karta ma'lumotlari |

---

## 🗄️ Database Buyruqlari

```powershell
cd "c:\Users\asus\Desktop\Loyihalarim\Nova English\backend"

# Schema o'zgarishlarini apply qilish
npm run db:push

# Migration yaratish
npm run db:migrate

# Prisma Client yangilash
npm run db:generate

# Database UI (brauzerda)
npm run db:studio
```

---

## ❗ Tez-Tez Uchraydigan Muammolar

### Bot ishlamayapti
- `.env` da `TELEGRAM_BOT_TOKEN` to'g'rimi? Tekshiring
- Bot boshqa joyda (masalan, serverda) ishlamaydimi? — Bir vaqtda 2 ta polling bo'lmaydi!

### Port band
```powershell
# 3001 portni ishlatayotgan dasturni o'ldirish
netstat -ano | findstr :3001
taskkill /PID <PID_raqami> /F
```

### `node_modules` yo'q xatosi
```powershell
cd "c:\Users\asus\Desktop\Loyihalarim\Nova English"
npm run install:all
```

---

## 📞 Aloqa

Savol yoki muammo bo'lsa: Telegram orqali `@nova_support`
