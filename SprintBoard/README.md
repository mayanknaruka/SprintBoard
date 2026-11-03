# SprintBoard

Real-time collaborative issue tracker built with the **MERN** stack for the KvonTech Full Stack Developer technical assessment.

Users can register, create projects they own, manage issues (status/priority), filter and search from the API, view dashboard analytics, and follow a live activity trail — with Socket.IO updates across connected clients.

## Features

- **Authentication** — register, login, JWT, bcrypt password hashing, protected routes/APIs
- **Projects** — create, list, view, update, delete (owner or admin only)
- **Issues** — create, edit, delete, change status (`To Do` / `In Progress` / `Done`) and priority (`Low` / `Medium` / `High`)
- **Dashboard** — totals for projects, issues, open / in-progress / completed / high-priority, plus charts
- **Filtering** — backend query params: `status`, `priority`, `project`
- **Search** — title search via API with frontend debounce
- **Activity log** — records create / update / status changes; shown on project detail and dashboard
- **Bonus** — Socket.IO live updates, admin/member roles, issue pagination

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19, React Router, Axios, Socket.IO Client, Vite |
| Backend | Node.js, Express, Mongoose, JWT, bcryptjs, express-validator, Socket.IO |
| Database | MongoDB (Atlas / local) with optional in-memory fallback for demos |

## Project structure

```text
├── client/          # React application
├── server/          # Express API
├── .env.example     # Environment variable template
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB Atlas URI **or** leave `MONGODB_URI=memory` to use an in-memory database (no install needed)

## Installation

```bash
# Backend
cd server
npm install
cp ../.env.example .env   # then edit values

# Frontend
cd ../client
npm install
```

## Environment variables

Copy `.env.example` to `server/.env`:

```env
PORT=5045
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://127.0.0.1:5174
```

Notes:

- Set `MONGODB_URI=memory` to run without a real MongoDB instance.
- Never commit real secrets.

Optional client env (`client/.env`):

```env
VITE_API_URL=http://127.0.0.1:5045/api
VITE_SOCKET_URL=http://127.0.0.1:5045
```

If omitted, the Vite dev server proxies `/api` and `/socket.io` to the backend.

## Running locally

```bash
# Terminal 1 — API
cd server
npm run dev

# Terminal 2 — UI
cd client
npm run dev
```

- API: [http://127.0.0.1:5045](http://127.0.0.1:5045)
- App: [http://127.0.0.1:5174](http://127.0.0.1:5174)

The first registered user on a fresh database is promoted to **admin**.

## API overview

### Auth

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/profile` | Current user (Bearer token) |

### Projects

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project detail + issues + activity |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project and its issues |

### Issues

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/issues` | List/filter/search with pagination |
| POST | `/api/issues` | Create issue |
| PUT | `/api/issues/:id` | Update issue |
| DELETE | `/api/issues/:id` | Delete issue |

Example filters:

```http
GET /api/issues?status=in-progress&priority=high&project=<id>&search=login&page=1&limit=10
```

### Dashboard

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard` | Aggregated stats, charts, recent activity |

## Authorization rules

- Authenticated users manage **their own** projects and related issues.
- **Admin** users can view/manage all projects.
- Members have limited scope to projects they created.

## License

Prepared as an original technical assessment submission.
