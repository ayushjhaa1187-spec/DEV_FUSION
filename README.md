# SkillBridge — Peer Learning & Doubt Resolution Platform

SkillBridge is a premium, college-focused platform designed to turn academic doubts into community-driven solutions, and knowledge into real-world reputation.

## 🚀 Vision
Bridge the gap between academic theory and practical mastery through:
- **AI-First Doubt Solving**: Instant hints and logical breakdowns powered by Google Gemini.
- **Peer Learning**: A robust community doubt feed with voting and resolution tracking.
- **Reputation Economy**: Automated point system enforced by Supabase triggers for active contributors.
- **Expert Mentorship**: Seamless booking and payments for high-quality student mentors.
- **Practice Engine**: Dynamic AI MCQ generation and real-time conceptual testing.

## 🛠️ Tech Stack
- **Frontend**: Next.js 15+, React 19, Vanilla CSS (Premium Design System)
- **Backend/Auth**: Supabase SSR (PostgreSQL, Auth, RLS, Storage)
- **AI**: Google Gemini (Direct Integration)
- **Payments**: Razorpay (Integration ready)

## 📦 Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ayushjhaa1187-spec/DEV_FUSION.git
   cd DEV_FUSION
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   RAZORPAY_KEY_ID=your_razorpay_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 🏗️ Deployment
The project is optimized for deployment on **Vercel**. Ensure all environment variables are added to the Vercel project settings.

## 📜 Database Migration
Run the following SQL scripts in the Supabase SQL Editor:
1. `supabase_schema.sql`
2. `supabase_functions.sql`
3. `supabase_trigger.sql`
4. `supabase_seed_data.sql`

---
Built with ❤️ during the DEV_FUSION Hackathon.
