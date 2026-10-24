# DevCollab

A collaboration platform for developers to discover projects, assemble teams, and build software together.

## Features

- **Project Discovery**: Search and browse engineering projects by tech stack, category, and requirements.
- **Developer Profiles**: Showcase technical skills, experience level, and availability.
- **Team Workspaces**: Collaborate with teammates using Kanban boards, roadmap milestones, and discussions.
- **Join Requests**: Apply to open project roles and manage team memberships.

## Tech Stack

- **Frontend**: React, Vite, React Router, Lucide Icons
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Argon2id password hashing with secure HTTP-only cookies

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/VinayKrishna-7/DevCollab.git
cd DevCollab
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create `.env` in the root and in `server/`:

```env
PORT=5001
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/devcollab?schema=public
SESSION_SECRET=your_session_secret
COOKIE_SECRET=your_cookie_secret
```

### 4. Database Setup

```bash
npx prisma migrate dev
npm run seed
```

### 5. Run the application

```bash
npm run dev
```

The frontend will run at `http://localhost:5173` and the backend at `http://localhost:5001`.

## Testing

```bash
npm test
```

## License

MIT
