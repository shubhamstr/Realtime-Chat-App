# Local Development, Build & Deployment Guide

## 1. Prerequisites & Environment

- **Node.js:** `>= 18.x` recommended (Docker uses `node:18-alpine`).
- **NPM:** `>= 9.x`.
- **Database:** One of:
  - MySQL `8.0` / MariaDB `10.4+` (default port: `3306`).
  - MongoDB `6.x` / `7.x` (default port: `27017`).
- **Docker:** Docker Desktop or Docker Engine with Docker Compose (v2 or v3.9+).

---

## 2. Environment Variables Specification

### 2.1 Backend Environment ([server/.env](file:///w:/shubham/personal/Realtime-Chat-App/server/.env))
Copy from [server/.env.example](file:///w:/shubham/personal/Realtime-Chat-App/server/.env.example):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express HTTP & Socket.IO server |
| `JWT_SECRET_KEY` | `socket_secret_chat` | Secret key used to sign session JWTs |
| `DB_PROVIDER` | `mongo` (or `mysql`) | Active database adapter (`mysql` or `mongo`) |
| `DB_HOST` | `localhost` | Hostname for MySQL server |
| `DB_PORT` | `3306` | Port for MySQL server |
| `DB_USER` | `root` | Username for MySQL database |
| `DB_PASS` | `""` | Password for MySQL user |
| `DB_NAME` | `socket_chat` | Database schema name for MySQL |
| `MONGO_URI` | `mongodb://localhost:27017/socket_chat` | MongoDB connection URI string |
| `CLIENT_URL` | `http://localhost:3000` | Frontend URL allowed in CORS whitelist |
| `SERVER_URL` | `http://localhost:5000` | Backend URL allowed in CORS whitelist |
| `ALLOWED_ORIGINS` | `""` | Comma-separated list of additional CORS origins |
| `SMTP_HOST` | *(Optional)* | SMTP server hostname for email alerts |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | *(Optional)* | SMTP authentication username |
| `SMTP_PASS` | *(Optional)* | SMTP authentication password |
| `SMTP_SECURE` | `false` | Set to `true` for TLS on port 465 |
| `SMTP_FROM` | *(Optional)* | Custom 'From' address for outbound alert emails |

### 2.2 Frontend Environment ([client/.env](file:///w:/shubham/personal/Realtime-Chat-App/client/.env))
Copy from [client/.env.example](file:///w:/shubham/personal/Realtime-Chat-App/client/.env.example):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | `http://localhost:5000` | Backend API and Socket.IO host URL |
| `REACT_APP_CLIENT_URL` | `http://localhost:3000` | Client URL used to generate shareable room links |

---

## 3. Local Setup & Execution Workflow

### Step 1: Install Dependencies
```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

### Step 2: Database Initialization

#### Option A: MySQL
1. Ensure MySQL is running on `localhost:3306`.
2. Create database: `CREATE DATABASE socket_chat;`
3. Import schema:
   ```bash
   mysql -u root -p socket_chat < server/db/socket_chat.sql
   ```
4. **Important SQL Fix:** Ensure the `email` column exists on `users`:
   ```sql
   ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL AFTER chatURL;
   ```
5. Set `DB_PROVIDER=mysql` in `server/.env`.

#### Option B: MongoDB
1. Ensure MongoDB daemon is running on `localhost:27017`.
2. Set `DB_PROVIDER=mongo` and `MONGO_URI=mongodb://127.0.0.1:27017/socket_chat` in `server/.env`.
3. Mongoose will create collections and indexes automatically on first launch.

### Step 3: Start Development Servers

In terminal 1 (Backend):
```bash
cd server
npm run dev
# Starts server with nodemon on http://localhost:5000
```

In terminal 2 (Frontend):
```bash
cd client
npm start
# Starts React development server on http://localhost:3000
```

---

## 4. Available NPM Scripts

### Backend ([server/package.json](file:///w:/shubham/personal/Realtime-Chat-App/server/package.json))
- `npm start` &rarr; Starts server in production mode (`node server.js`).
- `npm run dev` &rarr; Starts server with hot-reload via nodemon (`nodemon server.js`).

### Frontend ([client/package.json](file:///w:/shubham/personal/Realtime-Chat-App/client/package.json))
- `npm start` &rarr; Starts webpack-dev-server on port 3000.
- `npm run build` &rarr; Generates optimized production build in `client/build/`.
- `npm test` &rarr; Launches the Jest test runner.
- `npm run eject` &rarr; Ejects Create React App configuration (destructive).

---

## 5. Docker Workflows

### 5.1 Local Multi-Container Services
The repository includes compose configurations:
- [server/docker-compose.yml](file:///w:/shubham/personal/Realtime-Chat-App/server/docker-compose.yml): Runs server on port `3001` (mapped to internal `5000`), MySQL `8.0` on port `3308:3306`, and MongoDB `7.0` on port `27017:27017`.
- [client/docker-compose.yml](file:///w:/shubham/personal/Realtime-Chat-App/client/docker-compose.yml): Runs client on port `3000` (mapped to Nginx `80`).

### 5.2 Building Container Images Manually
```bash
# Build server
docker build -t chat-server:latest ./server

# Build client
docker build -t chat-client:latest ./client
```

---

## 6. CI/CD & Production Deployment (Oracle Cloud Infrastructure)

The project includes automated GitHub Actions workflows under [.github/workflows/](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows):

1. **[oci-deploy-server.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-server.yml):**
   - Triggers on push to `main` when files under `server/**` change.
   - Authenticates with Oracle Cloud Infrastructure Registry (`bom.ocir.io`).
   - Injects repository variables into `server/.env`.
   - Builds and pushes Docker image `chat-server:latest`.
   - SSH connects to Oracle VM, pulls latest image, and restarts container with `-p 3001:5000`.
2. **[oci-deploy-client.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-client.yml):**
   - Triggers on push to `main` when files under `client/**` change.
   - Builds multi-stage Docker image using Nginx Alpine.
   - Deploys container to Oracle VM with `-p 3000:80`.
3. **[deploy-mysql.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/deploy-mysql.yml) & [deploy-mongo.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/deploy-mongo.yml):**
   - Manual `workflow_dispatch` jobs to deploy databases to the Oracle VM.

---

## 7. Common Pitfalls & Troubleshooting

1. **Port Mismatch (3001 vs 5000 in Docker):**
   - Notice that [server/docker-compose.yml](file:///w:/shubham/personal/Realtime-Chat-App/server/docker-compose.yml#L9) and [oci-deploy-server.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-server.yml#L75) expose the server at host port `3001` (`-p 3001:5000`). If running under Docker, ensure `REACT_APP_API_URL` points to port `3001` rather than `5000`.
2. **Missing `client/src/constants.js`:**
   - The root [README.md](file:///w:/shubham/personal/Realtime-Chat-App/README.md#L58) instructs users to edit `client/src/constants.js`. This file **does not exist**. Configuration is driven entirely through [client/.env](file:///w:/shubham/personal/Realtime-Chat-App/client/.env) using `REACT_APP_API_URL` and `REACT_APP_CLIENT_URL`.
3. **MySQL `Unknown column 'email'` Error:**
   - If using `DB_PROVIDER=mysql`, running notification settings updates will fail unless the `email` column has been manually added to the `users` table, as it is omitted from the initial [server/db/socket_chat.sql](file:///w:/shubham/personal/Realtime-Chat-App/server/db/socket_chat.sql) dump.
4. **CORS Errors During Development:**
   - If the client is hosted on a non-standard port or hostname (e.g. `127.0.0.1` vs `localhost`), ensure `ALLOWED_ORIGINS` in `server/.env` includes that origin.
