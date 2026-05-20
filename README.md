# แคลจ๋าไม่ไหวแล้ว 🥗

**AI Food + Workout Tracker** — webapp HTML ไฟล์เดียว · เก็บข้อมูลใน localStorage + ซิงค์ Google Sheet ผ่าน Apps Script · ใช้ OpenRouter (Gemini Vision) ถอดรูปอาหารเป็น kcal/macro

ปันสร้างใน 30 นาทีด้วย Claude + Google Script — สอนสร้างได้ที่ [punnattapatch.com](https://punnattapatch.com)

---

## Stack

- **Frontend:** HTML + Tailwind v3 CDN + Material Symbols + Chart.js + DOMPurify (no build step)
- **AI:** OpenRouter (user-provided key) — default model `google/gemini-2.5-flash-lite`
- **Storage:** localStorage (primary) + Google Sheets via Apps Script (optional sync)
- **Deploy:** GitHub Pages (static HTML)

---

## ใช้งานครั้งแรก (Setup สำหรับผู้ใช้)

### 1. เปิด live URL → กรอกโปรไฟล์

ไปหน้า `#/profile` — กรอก:
- ชื่อแสดงผล
- เพศ + ปีเกิด
- ส่วนสูง (cm) + น้ำหนัก (kg)
- ระดับกิจกรรม (1-5)
- เป้าหมาย (ลด/รักษา/เพิ่ม น้ำหนัก)

ระบบจะคำนวณ TDEE ให้ทันที (Mifflin-St Jeor formula)

### 2. ตั้งค่า OpenRouter API Key

ไปหน้า `#/settings` → OpenRouter API Key
- สมัครฟรีที่ [openrouter.ai/keys](https://openrouter.ai/keys)
- เติมเงินขั้นต่ำ $5
- ค่าใช้จ่ายประมาณ ฿0.10/รูป (Gemini 2.5 Flash Lite)
- กรอก key → กด **ทดสอบ key** → กด **บันทึก**

### 3. (Optional) ตั้งค่า Google Sheets Sync

ดูหัวข้อ **Deploy Backend** ด้านล่าง

---

## Deploy Frontend (GitHub Pages)

```bash
# 1. สร้าง repo บน GitHub
cd /Users/r_nat/Documents/claude-code-pun-nattapatch/output/web-app/kal-jaa-mai-wai-laeo
git init
git add .
git commit -m "feat: initial kal-jaa-mai-wai-laeo"
git branch -M main

# 2. push (สร้าง repo ใหม่ใน GitHub ก่อน เช่น kal-jaa-mai-wai-laeo)
git remote add origin git@github.com:<your-user>/kal-jaa-mai-wai-laeo.git
git push -u origin main

# 3. ไปที่ Settings → Pages → Source: main branch / root → Save
```

Live URL: `https://<your-user>.github.io/kal-jaa-mai-wai-laeo/`

---

## Deploy Backend (Google Apps Script — Optional)

ใช้สำหรับ sync ข้อมูลไป Google Sheet (backup + multi-device)

### Step 1: สร้าง Google Sheet
1. ไป https://sheets.new
2. ตั้งชื่อ `KalJaa Sync`
3. คัดลอก Sheet ID จาก URL — เป็นส่วนระหว่าง `/d/` กับ `/edit`
   - ตัวอย่าง: `https://docs.google.com/spreadsheets/d/<COPY_THIS>/edit`

### Step 2: ติดตั้ง Apps Script
1. ในชีต: **Extensions → Apps Script**
2. ลบ code เดิมทั้งหมด → paste content จาก [`backend.gs`](backend.gs)
3. **File → Project properties → Script Properties → Add:**
   - key: `SHEET_ID`
   - value: (Sheet ID จาก Step 1)
4. กด **Save**

### Step 3: Deploy เป็น Web App
1. กด **Deploy → New deployment**
2. Type: **Web app**
3. Description: `KalJaa Sync v1`
4. Execute as: **Me**
5. Who has access: **Anyone**
6. กด **Deploy** → Authorize ตามที่ Google ขอ
7. คัดลอก **Web App URL** ที่ได้ (ขึ้นต้น `https://script.google.com/macros/s/.../exec`)

### Step 4: เชื่อมกับแอพ
1. เปิดแอพ → หน้า `#/settings`
2. กดที่ **Google Sheets Sync**
3. paste Web App URL → เปิด **ซิงค์อัตโนมัติ** → กด **บันทึก**
4. กด **ซิงค์เดี๋ยวนี้** เพื่อทดสอบ

แต่ละครั้งที่บันทึกมื้ออาหารหรือ workout จะ sync ขึ้น sheet อัตโนมัติ (debounced 2 วินาที)

---

## Features

### ✅ Phase 1 (ปัจจุบัน)
- [x] ถ่ายรูปอาหาร → AI วิเคราะห์ kcal+macro → user แก้ได้ → บันทึก
- [x] Manual food entry (search + 50 เมนูไทยยอดฮิต + custom)
- [x] Workout logging (14 กิจกรรม + MET formula × น้ำหนัก × เวลา)
- [x] Dashboard (radial chart kcal, macro bars, 7-day trend line)
- [x] History 7/30/all days (bar chart + expandable daily list)
- [x] Profile + TDEE (Mifflin-St Jeor) + macro targets
- [x] Settings (API key, sheet sync, vision model, export, clear)
- [x] Demo mode (`?mode=demo`) — sandbox สำหรับ TikTok CTA
- [x] PWA manifest (add to home screen)
- [x] Offline-first (localStorage primary)

### 🔮 Future (Phase 2+)
- [ ] Barcode scanner
- [ ] Apple Health / Health Connect sync
- [ ] Streaks + gamification
- [ ] Water intake tracking
- [ ] Coach/professional sharing view

---

## File Structure

```
kal-jaa-mai-wai-laeo/
├── index.html          # SPA ไฟล์เดียว — UI + business logic + data (~860 lines)
├── backend.gs          # Apps Script (paste ใน script.google.com)
├── manifest.json       # PWA metadata
└── README.md           # ไฟล์นี้
```

ไม่มี build step — เปิด index.html ในเบราว์เซอร์ทำงานได้เลย

---

## Architecture Notes

- **localStorage keys:** `kjmwl_profile`, `kjmwl_settings`, `kjmwl_logs`
- **Sync model:** debounced 2s — append/replace user's events ทั้งหมดใน sheet ทุกครั้ง (idempotent, no duplicate)
- **CORS:** Apps Script Web App ใช้ `mode:'no-cors'` + `Content-Type: text/plain` (เป็น workaround มาตรฐาน)
- **XSS:** ใช้ DOMPurify wrap innerHTML + escapeHtml ทุก user input
- **AI prompt:** force JSON output ด้วย `response_format: { type:'json_object' }`
- **Image:** resize ลงเหลือ 1024px กว้าง + JPEG quality 0.85 ก่อนส่ง AI (ลด token cost)

---

## TikTok Content Hooks

> "ผมสร้างแอพให้แฟนคุมน้ำหนักภายใน 30 นาที ด้วย Claude + Google Script"

> "ถ่ายรูปข้าวกะเพรา → AI บอก kcal ทันที — ทำได้ใน 30 นาที"

> "อยากให้ทีมในองค์กรคุณสร้าง webapp แบบนี้ได้เอง? ผมไปสอนถึงที่ → punnattapatch.com"

---

## Credits

- **Design:** Stitch by Google (theme "Serene Pulse")
- **Implementation:** Claude Code (Opus 4.7) + ปัน ณัฐพัชร์
- **AI Model:** Google Gemini 2.5 Flash Lite via OpenRouter
- **Thai food kcal data:** INMUCAL (สถาบันโภชนาการ ม.มหิดล) + CalForLife + FatSecret Thailand
- **MET values:** Compendium of Physical Activities 2024
