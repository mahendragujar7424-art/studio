
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

### 1. Direct Data Synchronization (No REST API)
This project does not use traditional REST or GraphQL API endpoints. Instead:
- **Client-Side SDK:** The frontend communicates directly with **Firebase Firestore** using the Client SDK.
- **Real-Time Snapshots:** Data is pushed to the UI instantly via `onSnapshot` listeners, enabling live progress bars and activity logs without manual refreshing.
- **Role-Based Security:** Access is controlled at the database level via `firestore.rules`, ensuring users only see data they are authorized to access.

### 2. Secure Server Actions
For logic that must remain on the server, such as AI generation:
- **Genkit Flows:** Located in `src/ai/flows`, these functions use the `'use server'` directive.
- **Gemini Integration:** These flows securely handle API keys on the server and return results directly to Client Components.

## Why is it so fast?

1. **Client-side Routing:** Navigation between sections happens instantly within the browser without full-page refreshes.
2. **Real-Time Data Streams:** Data updates (like task progress or new messages) are pushed from the server to your screen in milliseconds.
3. **Optimistic Updates:** The UI reflects your changes immediately while the background sync confirms them with the database.
