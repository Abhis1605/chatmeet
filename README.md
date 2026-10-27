# ChatMeet

ChatMeet is a real-time messaging and video-calling app built with Next.js, Prisma, PostgreSQL, Socket.IO, and 100ms. It supports direct chats, groups, open rooms, presence, read receipts, and account settings.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL
- GitHub and Google OAuth application credentials (currently required at startup)
- A 100ms account for video calls
- Resend credentials for production email delivery

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values. Keep secrets out of version control. The socket URLs in the example are for local development.

3. Generate the Prisma client and apply the schema:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Start the web app and Socket.IO server in separate terminals:

   ```bash
   npm run dev
   npm run socket
   ```

5. Open [http://localhost:3000](http://localhost:3000).

The Socket.IO server is a separate long-running process. In production, deploy it to a host that supports persistent Node.js services (for example Railway, Render, or Fly.io), and set `NEXT_PUBLIC_SOCKET_URL`, `CLIENT_ORIGIN`, `SOCKET_NOTIFY_URL`, and `SOCKET_NOTIFY_SECRET` to the matching service URLs/origins and shared secret. Configure the same database URL and NextAuth secret for both services. Vercel can host the Next.js app, but not this long-running socket server.

## Environment variables

See [\.env.example](.env.example) for the complete variable list and local defaults:

- `DATABASE_URL`: PostgreSQL connection string.
- `NEXTAUTH_SECRET`: secret used to sign sessions and socket tokens.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials; all four are currently required at startup.
- `RESEND_API_KEY`, `EMAIL_FROM`: email delivery settings.
- `HMS_ACCESS_KEY`, `HMS_SECRET`, `HMS_TEMPLATE_ID`: 100ms call settings.
- `NEXT_PUBLIC_SOCKET_URL`: browser-facing Socket.IO URL.
- `CLIENT_ORIGIN`: allowed web origin for Socket.IO CORS.
- `SOCKET_NOTIFY_URL`, `SOCKET_NOTIFY_SECRET`: private app-to-socket notification connection.
- `SOCKET_PORT`: local socket server port; production platforms may provide `PORT` instead.

## Useful commands

- `npm run dev`: start Next.js in development mode.
- `npm run build`: build the web app.
- `npm run start`: start the production web app.
- `npm run socket`: start the Socket.IO server.
- `npx prisma studio`: inspect local database records.

## Current limitations

The built-in rate limits use process memory. They are suitable for local development or a single app instance, but are not shared across serverless instances or multiple replicas. Use shared storage before scaling out.

No automated end-to-end test runner is configured in this repository yet. The sign-up and password-reset flows also require access to the generated OTP (email in production; development logs locally), so E2E setup needs a dedicated test database and a test email/OTP strategy.
