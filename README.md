# DEV_FUSION

<div align="center">

# 🎓 SKILLBRIDGE
### The Peer Learning & Doubt Resolution Ecosystem
**Ask. Learn. Mentor. Grow.**

[![Full Stack](https://img.shields.io/badge/Full%20Stack-Platform-6366f1?style=for-the-badge)](#)
[![AI Powered](https://img.shields.io/badge/AI-Doubt%20Solver-8b5cf6?style=for-the-badge)](#)
[![Mentor Sessions](https://img.shields.io/badge/Live-Mentor%20Sessions-10b981?style=for-the-badge)](#)
[![OAuth](https://img.shields.io/badge/Auth-Google%20%2B%20Email-4285F4?style=flat-square&logo=google)](#)
[![Payments](https://img.shields.io/badge/Payments-Sandbox-f59e0b?style=flat-square)](#)
[![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

## 🚀 Hero Banner
> **SkillBridge is a full-stack collaborative learning platform built for college students to resolve doubts faster, connect with verified mentors, attend live sessions, practice topic-wise tests, and grow through reputation-driven community learning.** It combines the speed of AI assistance with the trust of peer-to-peer learning — like a student-first Stack Overflow with live mentoring built in.

---

## ⚠️ The Problem

| Friction | Current Reality | Impact |
| :--- | :--- | :--- |
| **Scattered Doubt Solving** | Students jump between WhatsApp groups, random PDFs, YouTube videos, and friends for one answer. | Learning becomes slow, inconsistent, and frustrating. |
| **No Structured Peer Help** | Doubts are asked in informal groups with no tagging, no accepted answers, and no long-term knowledge base. | Useful answers get lost and repeated again and again. |
| **Limited Mentor Access** | Students struggle to find reliable seniors or mentors for 1:1 academic help. | Guidance remains inaccessible, especially before exams. |
| **Low Motivation to Contribute** | Most student communities lack points, badges, and visibility for helpful contributors. | Fewer students answer doubts consistently. |
| **Practice Feels Passive** | Students consume theory but rarely test themselves topic by topic. | Weak retention and poor exam readiness. |

---

## 💡 The Solution

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0f172a', 'primaryColor': '#8b5cf6', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#a78bfa', 'lineColor': '#94a3b8', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a'}}}%%
flowchart LR
    A([Student Has Doubt]) --> B{Ask AI First?}
    B -- Yes --> C[Instant Step-by-Step AI Answer]
    C --> D{Satisfied?}
    D -- Yes --> E[Learn & Exit]
    D -- No --> F[Post to Community]
    B -- No --> F
    F --> G[Peers & Mentors Answer]
    G --> H[Best Answer Accepted]
    H --> I[Reputation Awarded]
    I --> J([Knowledge Base Grows])

    classDef solution fill:#8b5cf6,stroke:#c4b5fd,color:#fff
    class A,B,C,D,E,F,G,H,I,J solution
```

---

## 🗺️ Platform Architecture

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0f172a', 'primaryColor': '#8b5cf6', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#a78bfa', 'lineColor': '#94a3b8', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a'}}}%%
flowchart TD
    subgraph Entry [Access Layer]
        S1[Landing Page] --> S2[Email / Google Auth]
        S2 --> S3[Profile Setup]
        S3 --> S4[College / Branch / Semester / Subjects]
    end

    subgraph DoubtFlow [Community Doubt Engine]
        S4 --> D1[Doubt Feed]
        D1 --> D2[Ask AI First]
        D2 --> D3[Post Doubt]
        D3 --> D4[Answers & Voting]
        D4 --> D5[Accepted Answer]
    end

    subgraph MentorFlow [Mentor Ecosystem]
        S4 --> M1[Mentor Directory]
        M1 --> M2[Mentor Profile]
        M2 --> M3[Available Slots]
        M3 --> M4[Book Session]
        M4 --> M5[Live Meeting Link]
    end

    subgraph TestFlow [Practice Engine]
        S4 --> T1[Choose Subject & Topic]
        T1 --> T2[AI Generated MCQ Test]
        T2 --> T3[Timer & Auto Submit]
        T3 --> T4[Instant Result]
        T4 --> T5[Score History]
    end

    subgraph RewardFlow [Gamification Layer]
        D5 --> R1[Reputation Points]
        T5 --> R1
        M5 --> R1
        R1 --> R2[Badges]
        R2 --> R3[Public Profile]
    end

    subgraph AdminFlow [Governance]
        S4 --> A1[Mentor Applications]
        A1 --> A2[Admin Review]
        A2 --> A3[Approve / Reject]
    end

    classDef entry fill:#6366f1,stroke:#818cf8,color:#fff
    classDef doubt fill:#8b5cf6,stroke:#a78bfa,color:#fff
    classDef mentor fill:#10b981,stroke:#34d399,color:#fff
    classDef test fill:#f59e0b,stroke:#fbbf24,color:#111827
    classDef reward fill:#ec4899,stroke:#f9a8d4,color:#fff
    classDef admin fill:#ef4444,stroke:#f87171,color:#fff

    class S1,S2,S3,S4 entry
    class D1,D2,D3,D4,D5 doubt
    class M1,M2,M3,M4,M5 mentor
    class T1,T2,T3,T4,T5 test
    class R1,R2,R3 reward
    class A1,A2,A3 admin
```

---

## ✨ Key Features

### ❓ Doubt Feed
| Feature | Description |
| :--- | :--- |
| **Rich Doubt Posting** | Students can post doubts with formatted text, code blocks, and images for better clarity. |
| **Academic Tagging** | Questions are categorized by subject, branch, and semester for highly relevant discovery. |
| **Answer Voting** | Upvote and downvote mechanisms help surface the most useful responses. |
| **Accepted Answer System** | One answer can be marked as accepted, rewarding the contributor and closing the loop. |
| **Smart Filters** | Filter doubts by Unanswered, Trending, My Subject, and My Branch. |

### 🤖 AI Doubt Solver
| Feature | Description |
| :--- | :--- |
| **Ask AI First** | Before posting publicly, students can get an instant AI-generated explanation. |
| **Step-by-Step Learning** | AI responds with concept breakdowns instead of only final answers. |
| **Post If Unsatisfied** | If the answer is not enough, the student can push the doubt directly to the community. |
| **Faster Resolution** | Reduces duplicate posts and gives immediate help during study sessions. |

### 🎓 Mentor System
| Feature | Description |
| :--- | :--- |
| **Mentor Applications** | Students can apply to become mentors and get approved by an admin. |
| **Live Session Scheduling** | Mentors can publish available time slots for doubt sessions. |
| **Session Booking** | Students reserve a 30-minute slot from listed availability. |
| **Meeting Integration** | Each session includes a Google Meet or Jitsi meeting link. |
| **Flexible Fees** | Mentors can set session fees from ₹0 to ₹500 with sandbox payment flow. |

### 📝 Practice Tests
| Feature | Description |
| :--- | :--- |
| **Topic-Based MCQs** | AI generates practice quizzes for selected subjects and topics. |
| **Timed Experience** | Built-in timer creates a realistic test environment. |
| **Auto Submit** | Tests submit automatically when time ends. |
| **Instant Feedback** | Students see scores and correct answers immediately. |
| **Score History** | Progress is tracked subject-wise for each user. |

### 🏆 Reputation & Gamification
| Feature | Description |
| :--- | :--- |
| **Point Economy** | Users earn points through answering, accepted solutions, logins, and tests. |
| **Achievement Badges** | Recognition badges motivate consistent contribution and learning. |
| **Public Profiles** | Users showcase reputation, badges, and answered doubts publicly. |
| **Community Trust Layer** | High-reputation members become more discoverable and respected. |

---

## 🌊 Core User Flows

### 1. 🧠 AI-First Doubt Resolution Flow
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0f172a', 'primaryColor': '#8b5cf6', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#a78bfa', 'lineColor': '#94a3b8', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a'}}}%%
flowchart LR
    A([Open Doubt Box]) --> B[Type Question]
    B --> C[Ask AI First]
    C --> D[Step-by-Step Explanation]
    D --> E{Satisfied?}
    E -- Yes --> F([Done])
    E -- No --> G[Post to Community]

    classDef ai fill:#8b5cf6,stroke:#c4b5fd,color:#fff
    class A,B,C,D,E,F,G ai
```

### 2. 💬 Community Answering Flow
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0f172a', 'primaryColor': '#6366f1', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#818cf8', 'lineColor': '#94a3b8', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a'}}}%%
flowchart LR
    A([Doubt Feed]) --> B[Open Question]
    B --> C[Read Answers]
    C --> D[Post Answer]
    D --> E[Upvotes / Downvotes]
    E --> F[Accepted Answer]
    F --> G([Reputation Earned])

    classDef community fill:#6366f1,stroke:#818cf8,color:#fff
    class A,B,C,D,E,F,G community
```

### 3. 📅 Mentor Booking Flow
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0f172a', 'primaryColor': '#10b981', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#34d399', 'lineColor': '#94a3b8', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a'}}}%%
flowchart LR
    A([Mentor Directory]) --> B[Mentor Profile]
    B --> C[Select Time Slot]
    C --> D[Sandbox Payment]
    D --> E[Booking Confirmed]
    E --> F([Join Live Session])

    classDef mentor fill:#10b981,stroke:#34d399,color:#fff
    class A,B,C,D,E,F mentor
```

### 4. 🧪 Practice Test Flow
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0f172a', 'primaryColor': '#f59e0b', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#fbbf24', 'lineColor': '#94a3b8', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a'}}}%%
flowchart LR
    A([Choose Subject]) --> B[Choose Topic]
    B --> C[Generate MCQ Test]
    C --> D[Start Timer]
    D --> E[Auto Submit]
    E --> F([Score + Correct Answers])

    classDef test fill:#f59e0b,stroke:#fbbf24,color:#111827
    class A,B,C,D,E,F test
```

### 5. 🏅 Reputation Growth Flow
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0f172a', 'primaryColor': '#ec4899', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#f9a8d4', 'lineColor': '#94a3b8', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a'}}}%%
flowchart LR
    A([Answer Doubt]) --> B[Earn +10]
    B --> C[Accepted Answer +25]
    C --> D[Daily Login +2]
    D --> E[Test Complete +5]
    E --> F([Badges + Public Credibility])

    classDef reward fill:#ec4899,stroke:#f9a8d4,color:#fff
    class A,B,C,D,E,F reward
```

---

## 🎭 Multi-Role Architecture

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0f172a', 'primaryColor': '#8b5cf6', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#a78bfa', 'lineColor': '#94a3b8', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a'}}}%%
graph TD
    CORE((SKILLBRIDGE CORE))
    CORE --- U[Student]
    CORE --- M[Mentor]
    CORE --- A[Admin]
    CORE --- AI[AI Engine]

    U --- U1[Post Doubts]
    U --- U2[Take Tests]
    U --- U3[Book Sessions]

    M --- M1[Answer Doubts]
    M --- M2[Manage Slots]
    M --- M3[Earn Reputation]

    A --- A1[Approve Mentors]
    A --- A2[Moderate Content]
    A --- A3[Monitor Platform]

    AI --- AI1[Instant Answers]
    AI --- AI2[MCQ Generation]
    AI --- AI3[Concept Explanations]

    classDef core fill:#fff,stroke:#8b5cf6,stroke-width:4px,color:#111827
    class CORE core
```

---

## 🧩 Reputation Model

| Action | Reward |
| :--- | :--- |
| **Answering a doubt** | `+10 points` |
| **Accepted answer** | `+25 points` |
| **Daily login** | `+2 points` |
| **Practice test completion** | `+5 points` |

### 🏅 Badge System
| Badge | Unlock Condition |
| :--- | :--- |
| **First Answer** | Submit your first answer |
| **Helpful Mentor** | Get multiple accepted answers as mentor |
| **Streak Master** | Maintain consistent daily logins |
| **Subject Expert** | Earn high reputation in a specific subject |

---

## 🔔 Notification System

| Trigger | Notification |
| :--- | :--- |
| **New answer received** | "Your doubt got an answer" |
| **Session reminder** | "Your mentor session starts in 30 minutes" |
| **Accepted answer** | "Your answer was accepted" |
| **Badge unlocked** | "You earned a new badge" |
| **Test completed** | "Your test result is ready" |

---

## 🎨 Design System

| Token | Value / Sample | UI Usage |
| :--- | :--- | :--- |
| **Primary Violet** | `#8B5CF6` | Main CTAs, active tabs, AI highlights |
| **Trust Blue** | `#2563EB` | Links, badges, info states |
| **Mentor Green** | `#10B981` | Mentor approval, booking success, live session states |
| **Alert Amber** | `#F59E0B` | Timers, pending actions, reminders |
| **Typography** | `Inter / Outfit` | Modern high-readability interface |
