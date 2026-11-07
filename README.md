# HiranandaniHomes

A luxury real estate advisory platform exclusively for **Hiranandani Estate, Thane**.
Zero broker commission — seekers register interest for free and pay a flat advisory fee only after a deal is signed.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

---

## First-Time Setup

Run these steps once before starting the project for the first time.

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root with at minimum:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="any-random-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure secret with:

```bash
openssl rand -base64 32
```

### 3. Create the database

```bash
npx prisma db push
```

### 4. Seed sample data (optional but recommended)

Creates 6 sample listings and two test accounts:

```bash
npx tsx prisma/seed.ts
```

Test credentials after seeding:

| Role  | Email                       | Password |
|-------|-----------------------------|----------|
| Admin | admin@bluebrics.com   | admin123 |
| Owner | owner@example.com           | owner123 |

---

## Starting the Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

The server is ready when you see `✓ Ready` in the terminal.

---

## Stopping the Server

Press **Ctrl + C** in the terminal where the server is running.

If the server is running in the background:

```bash
pkill -f "next dev"
```

---

## Building for Production

```bash
npm run build
npm start
```

---

## Key Pages

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Homepage |
| http://localhost:3000/listings | Browse all properties |
| http://localhost:3000/dashboard | Owner dashboard (login required) |
| http://localhost:3000/admin | Admin panel (Admin / Manager only) |
| http://localhost:3000/login | Sign in |
| http://localhost:3000/register | Create account |

---

## Database Management

Open a visual database browser:

```bash
npx prisma studio
```

Reset the database and re-seed:

```bash
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `file:./dev.db` for local SQLite |
| `NEXTAUTH_SECRET` | Yes | Random secret for session encryption |
| `NEXTAUTH_URL` | Yes | Base URL — `http://localhost:3000` locally |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth login |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth login |
| `AWS_REGION` | Optional | S3 region for image uploads |
| `AWS_ACCESS_KEY_ID` | Optional | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | Optional | AWS credentials |
| `AWS_S3_BUCKET_NAME` | Optional | S3 bucket for property images |
| `RAZORPAY_KEY_ID` | Optional | Razorpay for advisory fee payments |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay secret |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Google Maps on listing pages |
| `RESEND_API_KEY` | Optional | Email notifications on listing approval |
