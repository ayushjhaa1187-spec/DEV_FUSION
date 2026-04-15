# 🌐 The Integrated SkillBridge Ecosystem: Final Vision

This is the comprehensive blueprint for the **SkillBridge** platform, representing the full integration of Students, Mentors, and Organizations within a self-sustaining AI economy.

## 🔄 The Master Integrated Workflow

```mermaid
graph TD
    %% foundation
    subgraph Engine [The Engine: AI & Economic Layer]
        AI[Gemini 1.5 Pro]
        Wallet[AI Credit Wallet]
        Pay[Razorpay & Ledgers]
    end

    %% Entry
    Start((User)) --> Login[Supabase & OTP]
    Login --> Economy{Unlock Platform}
    
    %% Coupons
    Economy -->|Elite Code: JAHNVI_FIND| SubElite[Elite / Campus Pro]
    Economy -->|Pro Code: AYUSH_DEAL26| SubPro[Pro / Scholar Access]
    Economy -->|Direct Pay| Credits[Buy Credits: 2-15 per action]

    %% Paths
    Economy --> S_Hub[Student Hub]
    Economy --> M_Hub[Mentor Hub]
    Economy --> O_Hub[Organization Hub]

    %% Student Hub
    subgraph StudentLife [Student Journey]
        S_Hub --> Doubts[AI Doubt Solver]
        S_Hub --> Tests[Adaptive Practice & Certs]
        S_Hub --> Booking[Book Global Mentors]
    end

    %% Mentor Hub
    subgraph MentorLife [Mentor Lifecycle]
        M_Hub --> Independent[Independent Listing]
        M_Hub --> Apply[Apply to Organizations]
    end

    %% Organization Hub
    subgraph OrgLife [Institutional Hub]
        O_Hub --> OrgAdmin[Org Dashboard]
        OrgAdmin -->|Invite| S_Hub
        OrgAdmin -->|Recruit| Interview[Jitsi Interview Loop]
    end

    %% Integration Bridge
    Apply --> Interview
    Interview -->|Approved| Affiliated[Affiliated Mentor Status]
    Affiliated -->|Direct Mentor| S_Hub
    S_Hub -->|Feedback| Reputation[Gamified Points & Badges]
    Reputation -->|Talent Spotlight| OrgAdmin

    %% Aesthetic Styles
    style Engine fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style OrgLife fill:#052e16,stroke:#22c55e,color:#dcfce7
    style StudentLife fill:#1e3a5f,stroke:#3b82f6,color:#e0f2fe
    style MentorLife fill:#2d1b69,stroke:#7c3aed,color:#ede9fe
```

---

## 🛠️ Component Breakdown

### 1. Unified Identity & Roles
- **Students**: The primary consumers who engage in the Reputation Flywheel.
- **Independent Mentors**: Standalone experts listing globally. They receive **80-90%** of their gross booking amount.
- **Organizations**: Universities or Companies that create private learning clusters.

### 2. The Interaction Loop (Affiliation)
- **Recruitment**: Independent Mentors can apply to join an Organization.
- **Interviewing**: Admins use a dedicated Dashboard to schedule and conduct **Live Jitsi Interviews**.
- **Onboarding**: Once approved, mentors are "Affiliated," granting them priority access to the organization's student population.

### 3. The Economic Core
- **Coupons**: 
    - `JAHNVI_FIND`: Unlocks 1 year of **Elite** (Campus Pro) access.
    - `AYUSH_DEAL26`: Unlocks 1 year of **Pro** access.
- **Credits**: Users can buy one-time credit packs to solve doubts (2c), generate tests (5c), or receive AI coaching (8c).
- **Ledgers**: All transactions flow through a Commission Ledger for transparent platform management and mentor payouts.

### 4. The Outcome (Legacy)
- **Certificates**: Students passing AI-proctored tests (80%+) earn verifiable QR-backed certificates.
- **Talent Discovery**: Organizations use the internal **Leaderboard** and recruitment opt-ins to hire top-performing students directly from the platform.
