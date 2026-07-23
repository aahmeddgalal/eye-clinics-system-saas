# 🏥 Clinic Management System

A comprehensive, modern clinic management system designed to streamline patient records, visits, prescriptions, and medical attachments with high efficiency and a sleek, fast user experience.

---

## ✨ Key Features
- **Patient Management:** Create, read, update, and soft-delete patient records.
- **Visit Tracking:** Log medical visits, diagnoses, and track patient history.
- **Prescriptions & Medications:** Create, print, and manage prescriptions using a built-in medication catalog.
- **Medical Attachments:** Upload X-rays, lab results, and documents directly to patient profiles.
- **Queue System (Today's List):** Manage the daily patient queue in real-time.
- **Trash & Recovery System:** A smart recycle bin that holds deleted items for 7 days before permanent automated background deletion, with full manual recovery and hard-delete options.
- **Secure Authentication:** JWT-based authentication via Supabase.

---

## 🛠 Tech Stack
- **Frontend Framework:** Next.js (App Router), React
- **Styling:** Tailwind CSS (Custom UI/UX)
- **Backend & Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **Dates & Timezones:** Custom Cairo Timezone Handling

---

## 💻 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn or pnpm
- A Supabase Project (for DB and Auth)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd clinic-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```
> **Note:** The `SUPABASE_SERVICE_ROLE_KEY` is required for the permanent trash deletion feature to securely bypass Row Level Security (RLS) on the backend.

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🚀 Deployment & Hosting Strategy

This architecture is designed for the best performance at the lowest possible cost, ensuring long-term stability for the clinic.

### 1. Hosting Services (Recommended Approach)

#### A. Frontend: **Vercel**
- **Cost:** **Completely Free (Hobby Plan)**. 
- **Why?** The free tier is more than enough for a single clinic since the usage is strictly internal (doctor and assistants), and will never hit fair-use limits.

#### B. Database: **Supabase**
- **Cost:** **Free Tier**.
- **The 500MB Limit Concern:** The free tier includes 500MB of database space. **Do not worry about this.** This limit is solely for text data (names, diagnoses, medication names). Text consumes bytes. 500MB is enough to store hundreds of thousands of visits and prescriptions. It would take decades for a single clinic to fill this up.

#### C. File Storage (Images/Attachments)
This is the only real constraint, as medical images and PDFs consume significant space.

**Option 1: Stick with Supabase Storage (Recommended for simplicity)**
- The free tier gives **1GB** of storage.
- **Future Plan:** When space runs out (likely in a few months depending on upload volume), the doctor should upgrade to the Supabase **Pro Plan ($25/month)**.
- **Value:** $25/month provides **100GB** of file storage and **8GB** of database storage. This is standard operational cost for a clinic and guarantees zero-hassle maintenance.

**Option 2: Cloudflare R2 (The absolute cheapest option)**
- **Cost:** **10GB free per month**, and extremely cheap thereafter ($0.015/GB).
- **Requirement:** If chosen, the backend codebase must be refactored to upload files to Cloudflare R2 (via S3 API) instead of Supabase Storage.

---

## 🤝 Project Handover Guide

**Golden Rule:** 🚫 **Never use your personal email or credit card for client projects.**

Follow these professional steps to hand over the system to the clinic, absolving you of financial liability and transferring Data Ownership to the doctor:

### Step 1: Create a "Technical Identity" for the Clinic
- Create a brand new, dedicated Gmail account for the clinic (e.g., `dr.name.clinic.sys@gmail.com`).
- This email will be the **Master Key** for all platforms.

### Step 2: Create the Infrastructure Accounts
Using the new Gmail account, sign up for:
1. **GitHub:** To host the codebase (Use a Private Repository).
2. **Vercel:** Link it to the GitHub account for automatic deployments.
3. **Supabase:** To create the production database and storage bucket.

### Step 3: Configure Environments
- Copy the Supabase URL and Anon Key from the new production database.
- Add them as Environment Variables in the Vercel project settings.

### Step 4: Final Handover
On delivery day, provide the doctor with a physical or PDF document containing:
1. **System URL:** (e.g., `clinic-system.vercel.app`).
2. **Master Email Credentials:** Email and password.
3. **Hosting Credentials:** Logins for Vercel, Supabase, and GitHub.
4. **Crucial Action Item for the Doctor:** Instruct the doctor to log into Supabase and Vercel to **add their own clinic Credit Card**. This is vital to prevent the system from pausing if they ever exceed the free tier limits in the future.

By doing this:
- You are free from any legal/financial responsibilities regarding patient data.
- The doctor is the true Data Owner.
- You maintain a highly professional standard.
