# CRM - Professional Task Management

A high-performance CRM built with **TypeScript** and **React** (via Next.js), designed to bridge the gap between developers and clients with real-time progress tracking and role-based access control.

## Technical Stack

### Languages & Core
- **Primary Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Schema Validation:** [Zod](https://zod.dev/)

### UI & Styling
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [ShadCN UI](https://ui.shadcn.com/) (Radix UI primitives)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** Tailwind CSS Animate & Framer Motion (standard transitions)

### Backend & AI
- **Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (Real-time NoSQL)
- **Authentication:** [Firebase Auth](https://firebase.google.com/docs/auth)
- **Generative AI:** [Google Genkit](https://firebase.google.com/docs/genkit) with Gemini 2.5 Flash

## Project Architecture

### 1. Direct Data Synchronization
This project does not use traditional REST or GraphQL API endpoints. Instead:
- **Client-Side SDK:** The frontend communicates directly with **Firebase Firestore** using the Client SDK.
- **Real-Time Snapshots:** Data is pushed to the UI instantly via `onSnapshot` listeners.
- **Role-Based Security:** Access is controlled at the database level via `firestore.rules`.

### 2. AI-Powered Technical Briefs
- **Genkit Flows:** Server-side functions located in `src/ai/flows` handle AI generation.
- **Gemini Integration:** Uses Gemini 2.5 Flash to generate technical task briefs and project descriptions.

## Why is it so fast?

1. **Client-side Routing:** Navigation between sections happens instantly.
2. **Real-Time Data Streams:** Data updates are pushed from the server to your screen in milliseconds.
3. **Optimistic Updates:** The UI reflects changes immediately while background sync confirms them.
