# FleetDash

FleetDash is a React and Express fleet dashboard backed by MongoDB and Redis. The current repository includes vehicle and geofence APIs, telemetry processing, alerts, Redis Pub/Sub, Socket.IO updates, JWT authentication, and vehicle assignment history.

## Architecture

- `client/`: React 19, TypeScript, Vite, Leaflet, Axios, and Socket.IO client.
- `server/`: Express 5 and TypeScript APIs, Mongoose models, telemetry workers, Redis Pub/Sub, and Socket.IO.
- MongoDB stores fleet data and assignment history. Redis distributes realtime events between server processes.

## Requirements

- Node.js 22 or newer and npm.
- MongoDB and Redis reachable from the server.

## Local setup

1. Copy `server/.env.example` to `server/.env` and set MongoDB, Redis, JWT, and admin values. The JWT secret must have at least 32 characters.
2. Copy `client/.env.example` to `client/.env` if the local API endpoints differ.
3. Install dependencies with `npm ci` in both `server/` and `client/`.
4. In `server/`, run `npm run seed:admin` to create the initial administrator.
5. Start the API with `npm run dev` in `server/` and the UI with `npm run dev` in `client/`.
6. Open the Vite URL (normally `http://localhost:5173`) and sign in with the seeded administrator account.

The API defaults to port 3000. `CLIENT_URL` must exactly match the browser origin. Client variables are compiled into the browser bundle and must never contain secrets.

## Useful commands

```powershell
# server
npm ci
npm run typecheck
npm test
npm run build
npm start

# client
npm ci
npm run build
npm run lint
```

Run the server commands from `server/` and client commands from `client/`. `npm start` serves the compiled API from `server/dist`.

## Authentication and current access boundaries

Public authentication routes are `POST /api/auth/register` and `POST /api/auth/login`. Public registration is limited to driver accounts; administrator creation is through the seed script. No manager provisioning API exists yet, so manager accounts must be created through a controlled administrative process. Protected API calls use `Authorization: Bearer <access token>`. Access tokens expire after 15 minutes. Admin and manager users can access fleet, geofence, alert, and assignment operations. Socket.IO connections require a valid token and currently accept active admin and manager accounts.

Vehicle assignment routes are `POST /api/assignments/:vehicleId/assign`, `POST /api/assignments/:vehicleId/unassign`, and `GET /api/assignments/:vehicleId/history`. Active assignment indexes enforce one active driver per vehicle and one active vehicle per driver without transactions, which is compatible with standalone MongoDB.

## API overview

- `GET /health`
- `/api/auth`: registration and login
- `/api/vehicles`: vehicle listing, details, and creation
- `/api/assignments`: assignment, unassignment, and history
- `/api/geofences`: geofence CRUD
- `/api/alerts`: alert listing, filtering, details, and resolution
- `POST /api/telemetry`: telemetry ingestion

Inspect route/controller source for request and response schemas; a standalone OpenAPI specification is not currently maintained.

## Production notes and limitations

Production deployment has not been run or verified. Set `MONGO_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, and `CLIENT_URL` in the server environment; set `VITE_API_URL` and `VITE_SOCKET_URL` when building the client. The server requires MongoDB and Redis at startup. `/health` currently reports process liveness only and does not check dependency readiness.

Before exposing this system to a production network, implement device authentication for telemetry ingestion, driver-scoped vehicle and alert access, manager provisioning, and admin/manager user management. The dashboard currently authenticates interactive users, but its fleet operations are intended for admin and manager accounts. Drivers cannot yet access assigned vehicles through the API.

The existing bundle build reports a minified JavaScript chunk above 500 kB. No chunking changes were made because the current production bundle builds successfully and code splitting needs focused UI verification.
