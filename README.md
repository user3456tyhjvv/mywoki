<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1XG9dpJWqmNCbC0r2-Ry7wB2M5BLjM-bH

## Features

- 📊 **Web Traffic Analytics** - Real-time visitor tracking and traffic insights
- 👥 **Team Collaboration** - Create teams, invite members, manage permissions (NEW!)
- 💬 **Team Chat** - Firebase-powered real-time messaging for teams (NEW!)
- 🎥 **Meeting Scheduler** - Schedule and join Jitsi meetings with team members (NEW!)
- 🔔 **Notifications** - Real-time notifications for team invites and events (NEW!)

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Configure Supabase (see Backend Setup below)
4. Run the app:
   `npm run dev`

## Backend Setup

The backend server handles team invites, email sending, and database operations.

### Prerequisites
- Node.js
- Supabase project with authentication enabled

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create or update `backend/.env`:

```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Email (Optional - for invite notifications)
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourapp.com

# Frontend
FRONTEND_URL=http://localhost:3000

# AI Services
GEMINI_API_KEY=your-key
GROQ_API_KEY=your-key

# Server
NODE_ENV=development
PORT=3001
```

### Run Backend

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001`

## Team Feature Setup

After configuring the backend, you need to create the database tables for team collaboration:

### 1. Apply Migrations

**Method 1: Supabase SQL Editor (Recommended)**
1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Click "New Query"
3. Open `backend/sql/create_team_tables_supabase.sql`
4. Copy and paste the SQL
5. Click "Run"

**Method 2: Supabase CLI**
```bash
cd backend
supabase db push
```

For detailed migration instructions, see [backend/MIGRATIONS.md](backend/MIGRATIONS.md)

### 2. Test the Feature

1. Create a team in the Team dashboard section
2. Invite a colleague using their email
3. They'll receive an invite notification
4. They can accept/decline the invite
5. Once accepted, start collaborating!

See [TEAM_FEATURE_SUMMARY.md](TEAM_FEATURE_SUMMARY.md) for comprehensive documentation.