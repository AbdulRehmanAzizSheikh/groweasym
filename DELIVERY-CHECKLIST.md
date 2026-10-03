# GSA Farming — Completion Checklist

Platform ka pura status, kya bacha hai, aur delivery ke liye kya karna hai.
Last updated: **3 October 2026**

---

## 1. Project kahan hai

| | |
|---|---|
| Local code | `/home/abdulrehmanazizsheikh/Desktop/groweasym` |
| Backup (CSS wala purana kaam) | `/home/abdulrehmanazizsheikh/Desktop/groweasym-backup-before-tailwind` |
| GitHub | `https://github.com/AbdulRehmanAzizSheikh/groweasym` |
| Live URL | `https://groweasym.vercel.app` |
| Admin panel | `https://groweasym.vercel.app/admin` |

Stack: **Next.js 16 (App Router) + MongoDB/Mongoose + JWT + Razorpay + Gmail (nodemailer) + plain CSS**
(Chaaron pages kaam kar rahe hain — TypeScript check aur production build dono clean hain.)

---

## 2. Kya ban gaya hai (READY)

### Pages — sab reference design me

| Page | Route | Status |
|---|---|---|
| Login | `/login` | Ready |
| Register | `/register` | Ready |
| Dashboard | `/dashboard` | Ready |
| Recharge | `/recharge` | Ready (Razorpay chahiye) |
| Withdraw | `/withdraw` | Ready (Gmail chahiye) |
| Plans | `/plan` | Design ready, buying band |
| My Team | `/team` | Ready |
| Account | `/me` | Ready |
| My Wallet | `/me/wallet` | Ready |
| Recharge Record | `/me/recharges` | Ready |
| My Investment | `/me/investments` | Ready |
| Change Password | `/change-password` | Ready |
| **Admin Panel** | `/admin` | Ready |

### Backend — 18 API routes

**Auth**
- `POST /api/auth/register` — naam, mobile, password, referral code
- `POST /api/auth/login` — mobile + password
- `POST /api/auth/logout`
- `GET /api/auth/me` — current user
- `POST /api/auth/change-password`

**RazorPay ( paisa aana)**
- `POST /api/razorpay/order` — order banata hai
- `POST /api/razorpay/verify` — payment verify karke balance deta hai

**Withdraw ( paisa nikalna)**
- `POST /api/withdraw/request`

**User data**
- `GET /api/team`
- `GET /api/wallet/summary`
- `GET /api/wallet/transactions`

**Admin**
- `POST /api/admin/login` — `.env` ke `ADMIN_PASSWORD` se
- `POST /api/admin/logout`
- `GET /api/admin/users`
- `POST /api/admin/balance` — paise add / kaat / set
- `GET /api/admin/withdrawals`
- `POST /api/admin/withdrawal` — paid ya reject
- `GET /api/admin/transactions`

### Database (3 models)

- **User** — fullName, mobileNumber, password (hashed), balance, heldBalance, blocked, referralCode, bank details
- **Transaction** — har paise ka aane-jaane ka record
- **Withdrawal** — withdrawal request + uska status

### Testing

`scripts/e2e.sh` — **70 tests, 70 pass, 0 fail**

Chalaane ka tareeqa:
```bash
BASE=http://localhost:3000 ADMIN_PASS=TestAdmin123 bash scripts/e2e.sh
```

Ye cover karta hai: registration validation, session, unauthorized access rokna,
admin auth, balance add/remove, poora withdrawal lifecycle (hold → paid → reject),
aur Razorpay signature forgery.

---

## 3. Bhi hui hui kui cheez — ye karne ki zaroorat hai

### A) Vercel me environment variables daalo (sabse zaroori)

Vercel → Project → **Settings → Environment Variables**

| Variable | Kya daalna hai | Zaroori? |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | **Haan** |
| `JWT_SECRET` | Koi lamba random string (32+ char) | **Haan** |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys → Key ID | **Haan** |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | **Haan** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` | **Haan** |
| `EMAIL_USER` | Aapki Gmail address | **Haan** (withdraw ke liye) |
| `EMAIL_PASSWORD` | Gmail **App Password** (16 character) | **Haan** (withdraw ke liye) |
| `ADMIN_PASSWORD` | Admin panel ka password | **Haan** |
| `MIN_WITHDRAW` | `100` | Optional |
| `NEXT_PUBLIC_APP_URL` | `https://groweasym.vercel.app` | Optional |
| `EMAIL_FROM` | `"GSA Farming" <aapki@gmail.com>` | Optional |
| `ADMIN_EMAIL` | Jahan withdrawal mail aani chahiye | Optional |

> **Gmail App Password kaise banayein:**
> Google Account → Security → 2-Step Verification ON karo → App Passwords → "Mail" select → Generate → 16-character code copy karo. Aapke Gmail ka normal password **kaam nahi karega**.

> `.env` me sirf `ADMIN_PASSWORD=TestAdmin123` abhi test value pada hai — delivery se pehle ise apni asli value se badal do.

**Badalne ke baad:** Vercel me **Redeploy** karna zaroori hai (Deployments → ⋮ → Redeploy). Sirf save karne se naya build nahi hota.

---

### B) Pehli baar ke liye bhi ye karo

1. **Razorpay test mode** se shuru karo — live keys abhi mat daalo
2. Test user banao, admin se ₹5000 add karo, phir withdraw request karo
3. Check karo ki withdrawal mail aapki Gmail par aayi
4. Admin panel me "Mark paid" daba ke dekho ki balance sahi behave karta hai

---

## 4. Jo abhi baaki hai (BAKI)

### Zaroori — bina iske delivery mat karo

| # | Kaam | Kahan | Status |
|---|---|---|---|
| 1 | Vercel me 8 env variables daalna | Vercel dashboard | Aapke liye |
| 2 | Gmail App Password banana + daalna | Google Account settings | Aapke liye |
| 3 | Razorpay test keys lena | Razorpay Dashboard | Aapke liye |
| 4 | `ADMIN_PASSWORD` ko apni value se badalna | `.env` + Vercel | Aapke liye |
| 5 | Redeploy karna | Vercel | Aapke liye |
| 6 | Mobile number par **live** Razorpay payment test karna | App | Baad me |

### Chhote fixes (main kar sakta hoon, batao to kar deta hoon)

| # | Kaam | File |
|---|---|---|
| 7 | `/plan` ka "Plan Active Now" button sirf toast dikhata hai — asli plan buying backend nahi hai | `app/plan/page.tsx` |
| 8 | Admin panel me user **block / unblock** button nahi hai (model me field hai, UI me nahi) | `app/admin/page.tsx` |
| 9 | Admin panel me balance edit karte waqt **note** ka input nahi hai | `app/admin/page.tsx` |
| 10 | `/me` ke "Support" aur "Discussion group" sirf `/team` par bhejte hain — asli WhatsApp/Telegram link nahi | `app/me/page.tsx` |
| 11 | Password strength / forgot-password flow nahi hai | — |
| 12 | Daily income / plan payouts ka cron job nahi hai (agar plan system chalu karna ho) | — |
| 13 | `npm run lint` me 33 errors hain (mostly `any` type) — build par koi asar nahi, par clean karna behtar hai | Multiple |
| 14 | Referral commission actually calculate nahi hoti (sirf total dikhata hai) | `app/api/team/route.ts` |

---

## 5. Jo main theek kar chuka hoon (problems jo aayi thi)

| Problem | Fix |
|---|---|
| Reference site copy karne ke liye uska base stylesheet (`public/css/style.css`) use kiya | Layout ab pixel-level match karta hai |
| Dashboard ka banner 1280px bara ho raha tha | `.appCapsule` ka padding `p-0` kiya — ab 600×450 |
| Banner ke corners curve ho rahe the | `body` ka `border-radius: 0` + `!important` |
| Center nav icon galat tha | `public/icons/center-grid.svg` banaya |
| `/me` par balance **white-on-white** invisible tha | `.banyue` ka `color:#fff` fix kiya |
| Saare inputs invisible the (border nahi tha) | `border: 1px solid #ced4da` + green focus |
| `/plan` par galat thumbnail aa raha tha | Product image use ki |
| `/team` ka referral box unstyled tha | `.referInput` class banayi |
| Admin API kisi bhi user ko khul rahi thi | Alag `gsa_admin` cookie + `requireAdmin()` guard |
| Razorpay verify client ka amount maan raha tha | Amount ab DB se uthaya jata hai + Razorpay se dobara check |
| Withdraw me double-request ho sakta tha | `heldBalance` se atomically hold hota hai |
| e2e test me 20 fail | Test harness ka bug tha (`UID` readonly, JSON quoting) — **ab 70/70 pass** |

---

## 6. Delivery ka checklist

- [ ] Vercel me saari 8 env variables daal di
- [ ] Gmail App Password bana ke daal diya
- [ ] Razorpay **test** keys daal di
- [ ] `ADMIN_PASSWORD` apni value se badal diya
- [ ] Redeploy kiya
- [ ] Naya user register karke login test kiya
- [ ] Admin panel ka password chala ke andar gaya
- [ ] Admin se kisi user ka balance add/remove kiya
- [ ] Razorpay se ₹1 test recharge kiya
- [ ] Withdraw request ki aur Gmail par mail check kiya
- [ ] Admin me "Mark paid" daba ke balance verify kiya
- [ ] Mobile number par poora flow test kiya
- [ ] (Live jaane se pehle) Razorpay live keys + `https` webhook set kiya

---

## 7. Important security notes (client ko bata dena)

1. **Admin password `.env` me hai** — `.env` kabhi GitHub par push nahi karna (`.gitignore` me hai, par dhyan rakhna)
2. **Razorpay live keys** kabhi browser me expose nahi honi chahiye — `RAZORPAY_KEY_SECRET` sirf server par hai
3. **Razorpay webhook** set karna recommended hai, taaki payment capture ho par network fail ho jaye to bhi balance barqarar credit ho
4. **Rate limiting** abhi nahi hai — production se pehle login aur withdraw endpoints par lagana recommended hai
5. **Paise manually bhejne** ka process hai — user ka paisa hold ho jata hai, admin confirm karta hai, tab release hota hai. Ye design sahi hai kyunki double-request nahi ho sakta

---

## 8. Files ka map

```
app/
  login/ register/ dashboard/ recharge/ withdraw/
  plan/ team/ me/ change-password/ admin/
  api/
    auth/ (login, register, logout, me, change-password)
    razorpay/ (order, verify)
    withdraw/ (request)
    team/  wallet/ (summary, transactions)
    admin/ (login, logout, users, balance, withdrawals, withdrawal, transactions)
components/
  AppShell.tsx        — header + 5-item bottom nav
  TransactionList.tsx — wallet/recharge/investment lists
  useSession.ts       — login check + user fetch
lib/
  auth.ts       — JWT, cookies, requireUser / requireAdmin
  mailer.ts     — Gmail withdrawal mail
  mongodb.ts    — connection cache
  assets.ts     — saari image URLs (ek jagah)
  plans.ts      — plan list
  format.ts     — ₹ formatting
models/
  User.ts  Transaction.ts  Withdrawal.ts
public/
  css/style.css, css/mui.min.css   — reference base stylesheet
  icons/center-grid.svg
scripts/
  e2e.sh        — 70 API tests
.env.example    — saari variables ka template
```
