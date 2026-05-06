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

## Database Interaction Patterns

The application leverages Firebase Firestore using the following patterns:

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

### 4. Data Structure
- **/users**: Flat collection for member profiles.
- **/tasks**: Main collection containing project metadata, progress, and status.
- **/tasks/{id}/comments**: Nested sub-collection for task-specific communication logs.

## Key Features

- **Real-time Synchronization:** Firestore listeners ensure progress updates and messages appear instantly.
- **Role-Based Workspaces:** Sidebars and dashboards adapt dynamically to the logged-in user's role.
- **Post-Completion Workflow:** Formal project sign-off by clients and archiving by administrators.
- **AI-Powered Assistance:** Integrated tool to help generate professional project summaries for portfolios.
