# CloudCRM - Professional Task Management

A comprehensive CRM designed to bridge the gap between developers and clients with real-time progress tracking and role-based access control.

## Tech Stack

- **Language:** TypeScript
- **Framework:** Next.js (App Router)
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth
- **UI & Styling:** Tailwind CSS, Radix UI, ShadCN UI
- **Generative AI:** Google Genkit with Gemini 2.5 Flash
- **Icons:** Lucide React

## Project Architecture

- **Admin:** Manages users, assigns projects, and oversees global workspace health.
- **Developer:** Executes tasks, updates completion percentages (0-100%), and responds to client feedback.
- **Client:** Monitors live progress bars and provides structured suggestions for specific tasks.

## Key Features

- **Real-time Synchronization:** Firestore listeners ensure progress updates and messages appear instantly.
- **Role-Based Workspaces:** Sidebars and dashboards adapt dynamically to the logged-in user's role.
- **Post-Completion Workflow:** Formal project sign-off by clients and archiving by administrators.
- **AI-Powered Assistance:** Integrated tool to help generate professional project summaries for portfolios.
