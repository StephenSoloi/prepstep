# 🔨 PrepStep — AI-Powered Mock Interviewer

**PrepStep** is a high-performance, voice-first AI platform designed to help job seekers nail their next interview. By combining instant resume parsing with real-time voice-to-voice interaction, PrepStep offers a realistic and low-stress environment for candidates to practice and refine their communication skills.

---

## 🚀 Key Features

### 📄 Intelligent Resume Parsing
*   **Gemini-Powered Extraction**: Uses Gemini (Flash 1.5/2.0) to instantly extract skills, education, and career history from PDF uploads.
*   **Integrity Gatekeeper**: Automatically validates if the uploaded document is a genuine resume/CV, rejecting recipes, technical metadata, or gibberish with friendly user feedback.
*   **Low-Barrier Entry**: Supports everything from professional executive CVs to a beginner's first resume draft.

### 🎙️ Real-Time Voice Interviewing
*   **Voice-to-Voice Interaction**: Seamless real-time conversation using the **Vapi AI** infrastructure.
*   **Realistic Latency**: Sub-500ms response times for a feedback loop that feels natural and lifelike.
*   **Context-Aware Questioning**: AI interviewers reference your specific job history and target company (e.g., Safaricom, Google) to ask tailored questions.

### 📊 Comprehensive Performance Reports
*   **STAR Method Alignment**: Feedback is categorized based on the Situation, Task, Action, and Result framework.
*   **Metric Breakdown**: Get scored on confidence, technical precision, clarity, and overall readiness.
*   **Suggested Answers**: See model answers for every question asked during the session to understand where you can improve.

### 💳 Tiered access & Payments
*   **Credit System**: New users start with 2 free interview credits.
*   **Clerk Authentication**: Secure login and session management.
*   **M-Pesa Integration**: Seamless local payment processing for "Pro" tier upgrades.

---

## 🏎️ Core Workflow

```mermaid
graph TD
    A[User Uploads Resume] --> B{AI Validation}
    B -- Not a Resume --> C[Friendly Error Alert]
    B -- Valid Resume --> D[AI Generates Questions]
    D --> E[Real-Time Voice Interview]
    E --> F[Session Ends]
    F --> G[AI Transcribes & Analyzes]
    G --> H[Personalized Feedback Report]
    H --> I[Saved to Dashboard]
```

---

## ⚙️ How It Works (The Mechanics)

### 1. Account Creation & Security
PrepStep leverages **Clerk** for enterprise-grade authentication. Upon first sign-in, the system automatically checks our PostgreSQL database via **Prisma** to see if a user record exists; if not, it initializes a new profile and grants **2 complimentary interview credits** to start their journey.

### 2. Intelligent Content Extraction
When a user drops a PDF:
*   **PDF Tokenization**: Our backend uses a specialized parser to extract raw text blocks from the binary PDF stream.
*   **Gemini Extraction**: This raw text is sent to **Gemini 1.5 Flash**. The AI performs a "Structural Analysis" to identify Name, Skills, Summary, and Experience.
*   **Gatekeeping**: Gemini is instructed to validate the document type. If it's a grocery list or technical metadata, it rejects the file and provides a friendly explanation instead of hallucinating results.

### 3. Smart Question Generation
If the resume is valid, the AI generates exactly **5 High-Impact Questions**:
1.  **The Hook**: "Tell us about yourself" (Standard Icebreaker).
2.  **The Fit**: How the candidate contributes specifically to the Target Company.
3.  **The Behavior**: A scenario-based question matching their specific technical level.
4.  **The Depth**: A targeted inquiry into a standout project or role mentioned in the resume.
5.  **The Horizon**: A general "up-to-date" question about recent trends or industry standards in their field to test their current awareness.

### 4. Real-Time Voice Intelligence (Vapi)
Once questions are ready, we initialize a **Vapi AI Session**:
*   **Speech-to-Text (STT)**: Vapi listens to the user's microphone with high accuracy.
*   **Natural Conversation**: Vapi acts as the "Voice Bridge," managing the flow of the interview, handling interruptions, and maintaining a lifelike rhythm.
*   **Low Latency**: It utilizes optimized WebRTC channels to ensure there is no awkward "computing" pause between the user's answer and the AI's next response.

### 5. Persistent Data & Feedback
After the interview, the entire **Transcript** is sent back to Gemini for a "STAR Method Review." All results—including the transcript, suggested better answers, and performance metrics—are stored in **PostgreSQL**. This allow users to visit their **Dashboard** any time to track progress and see how they are improving over time.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15+](https://nextjs.org/) (App Router, Server Actions) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) |
| **Authentication** | [Clerk](https://clerk.com/) |
| **AI (Logic)** | [Google Gemini 1.5 Flash](https://aistudio.google.com/) (Parsing & Feedback) |
| **AI (Voice)** | [Vapi SDK](https://vapi.ai/) |
| **Database** | [Prisma ORM](https://www.prisma.io/) with PostgreSQL |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📂 Project Structure

```text
prepstep/
├── prisma/                 # Database schema and migrations
├── src/
│   ├── app/                # Next.js App Router (Pages & API Routes)
│   │   ├── api/            # API endpoints (Resume parsing, Feedback gen, User status)
│   │   ├── dashboard/      # User interview history
│   │   └── pricing/        # Subscription and payment UI
│   ├── components/         # Reusable UI components (Navbar, Upload, Interview Logic)
│   └── lib/                # Utility functions (Prisma client, Helper tools)
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

---

## 🚦 Getting Started

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL Database
*   API Keys: Clerk, Gemini (Google AI Studio), Vapi.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/StephenSoloi/prepstep.git
    cd prepstep
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```bash
    # Database
    DATABASE_URL="your_postgresql_url"
    DIRECT_URL="your_direct_postgresql_url"

    # Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
    CLERK_SECRET_KEY=...

    # AI
    GEMINI_API_KEY="your_google_ai_studio_key"
    VAPI_API_KEY="..."
    ```

4.  **Database Migration**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run Locally**:
    ```bash
    npm run dev
    ```

---

## 🔄 Recent Updates

### Gemini 1.5 Migration (March 2026)
*   Deprecated Groq/Llama in favor of **Gemini 1.5 Flash**.
*   Implemented **JSON Output Mode** for high-reliability parsing without regex cleaning.
*   Added **Intelligent Document Validation** to the `parse-resume` API to prevent non-resume uploads.
*   Modernized the **Error Alert UI** with responsive glassmorphism designs for mobile-first accessibility.

---

## 🎓 KCA University Presentation Pitch

> "Empowering the next generation of professionals through AI-driven confidence."

### The Problem
In today's competitive job market, academic excellence (GPA) is no longer enough. Many brilliant students from institutions like **KCA University** fail to secure roles not because they lack skills, but because they lack **Interview Confidence**. Private coaching is expensive, and static "tip lists" don't provide the pressure of a real conversation.

### The Solution: PrepStep
PrepStep acts as a **24/7 Personal Career Coach**. It provides a safe, private space for students to stumble, learn, and iterate. 
*   **Accessibility**: Works on any mobile phone or laptop.
*   **Contextual**: It doesn't ask generic questions; it asks questions about *your* experience and *your* target role.
*   **Localized Payments**: Integration with **M-Pesa** ensures that Kenyan students can easily access premium features without needing a credit card.

### Potential Stakeholder Q&A

**Q: How do we know the AI isn't just "making up" industry standards?**
*   **A**: PrepStep utilizes the **Gemini 1.5** model, which is trained on vast datasets of professional corporate standards, technical documentation, and behavioral interviewing frameworks like the STAR method.

**Q: Is student data safe? Are resumes sold?**
*   **A**: Absolutely not. We use **Clerk** for identity protection and **Surgical Data Handling** where resumes are used only for the active session. We prioritize data integrity and do not use personal data to train public models.

**Q: How can this scale to thousands of students at once?**
*   **A**: The architecture is **Serverless (Vercel)** and **API-First (Gemini/Vapi)**. This means the system can handle 10 or 10,000 concurrent interviews without needing a massive physical server farm.

**Q: Why should an organization fund PrepStep?**
*   **A**: Because you aren't just funding an app; you are funding **Employability**. Increasing the successful placement rate of graduates directly boosts the reputation of the institution and the economic strength of the local industry.

---

## 📜 License
This project is private and owned by Stephen Soloi. All rights reserved.
