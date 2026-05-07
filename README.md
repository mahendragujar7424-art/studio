
# CloudCRM - Professional Task Management

A high-performance CRM built with **TypeScript** and **React** (via Next.js), designed to bridge the gap between developers and clients with real-time progress tracking and role-based access control.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Library:** React 19
- **Language:** TypeScript
- **Database:** Firebase Firestore (Real-time NoSQL)
- **Authentication:** Firebase Auth
- **UI & Styling:** Tailwind CSS, Radix UI, ShadCN UI
- **Generative AI:** Google Genkit with Gemini 2.5 Flash
- **Icons:** Lucide React

## Project Architecture

- **Admin:** Manages users, assigns projects, and oversees global workspace health.
- **Developer:** Executes tasks, updates completion percentages (0-100%), and responds to client feedback.
- **Client:** Monitors live progress bars and provides structured suggestions for specific tasks.

## Why is it so fast?

This application leverages **Next.js Client-side Hydration** and **Firestore Real-time Snapshots**. Instead of traditional page reloads, the app uses:
1. **Client-side Routing:** Navigation between sections happens instantly within the browser without full-page refreshes.
2. **Real-Time Data Streams:** Data updates (like task progress or new messages) are pushed from the server to your screen in milliseconds.
3. **Optimistic Updates:** The UI reflects your changes immediately while the background sync confirms them with the database.

## Database Interaction Patterns

### 1. Real-Time Synchronization
Instead of traditional API calls, the app uses Firestore snapshots. This ensures that:
- Clients see progress updates the moment a Developer moves a slider.
- Comments and suggestions appear instantly in the project log.
- Dashboard metrics update automatically as tasks are completed.

### 2. Role-Based Security Rules
Access control is enforced at the database level (see `firestore.rules`). 
- **Privacy:** Clients can only access tasks assigned to them.
- **Integrity:** Only assigned Developers can update the progress of their specific tasks.
- **Administration:** Only Admins can create users or archive projects.

### 3. Non-Blocking Writes
To ensure a fluid user experience, the app utilizes `non-blocking-updates.tsx`. This allows the UI to remain responsive while data is being synchronized to the cloud in the background.
