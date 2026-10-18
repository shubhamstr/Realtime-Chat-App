# Local Development, Build & Deployment Guide

## 1. Prerequisites & Environment

- **Node.js:** `>= 18.x` recommended (Docker uses `node:18-alpine`).
- **NPM:** `>= 9.x`.
- **Database:** MongoDB `6.x` / `7.x` (default port: `27017`).
- **Docker:** Docker Desktop or Docker Engine with Docker Compose (v2 or v3.9+).

---

## 2. Environment Variables Specification

### 2.1 Backend Environment ([server/.env](file:///w:/shubham/personal/Realtime-Chat-App/server/.env))
Copy from [server/.env.example](file:///w:/shubham/personal/Realtime-Chat-App/server/.env.example):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express HTTP & Socket.IO server |
| `JWT_SECRET_KEY` | `socket_secret_chat` | Secret key used to sign session JWTs |
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

1. Ensure MongoDB daemon is running on `localhost:27017` (or start via `npm run db` in `server/`).
2. Provide `MONGO_URI=mongodb://127.0.0.1:27017/socket_chat` in `server/.env`.
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
- `npm run db` &rarr; Starts MongoDB container via Docker Compose (`docker compose -f docker-compose.yml up mongo -d`).

### Frontend ([client/package.json](file:///w:/shubham/personal/Realtime-Chat-App/client/package.json))
- `npm start` &rarr; Starts webpack-dev-server on port 3000.
- `npm run build` &rarr; Generates optimized production build in `client/build/`.
- `npm test` &rarr; Launches the Jest test runner.
- `npm run eject` &rarr; Ejects Create React App configuration (destructive).

---

## 5. Docker Workflows

### 5.1 Local Multi-Container Services
The repository includes compose configurations:
- [server/docker-compose.yml](file:///w:/shubham/personal/Realtime-Chat-App/server/docker-compose.yml): Runs server on port `3001` (mapped to internal `5000`) and MongoDB `7.0` on port `27017:27017`.
- [client/docker-compose.yml](file:///w:/shubham/personal/Realtime-Chat-App/client/docker-compose.yml): Runs client on port `3000` (mapped to Nginx `80`).

### 5.2 Building Container Images Manually
```bash
# Build server
docker build -t chat-server:latest ./server

# Build client
docker build -t chat-client:latest ./client
```

---

## 6. CI/CD & Production Deployment (Amazon Web Services - ECR & EC2)

The project includes automated GitHub Actions workflows under [.github/workflows/](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows):

1. **[aws-deploy-server.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/aws-deploy-server.yml):**
   - Configurable for manual trigger (`workflow_dispatch`) or automated trigger on changes under `server/**`.
   - Authenticates to AWS via `aws-actions/configure-aws-credentials` and logs into Amazon ECR.
   - Injects repository variables and secrets into `server/.env`.
   - Builds and pushes Docker image to ECR tagged with `latest` and commit SHA.
   - Generates masked ECR login token on GitHub Actions runner and passes it to the EC2 instance via SSH environment variables.
   - SSH connects to EC2 instance, authenticates Docker with ECR via piped token, pulls latest image, and restarts container with `-p 3001:5000` (`--restart always`).
2. **[aws-deploy-client.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/aws-deploy-client.yml):**
   - Configurable for manual trigger (`workflow_dispatch`) or automated trigger on changes under `client/**`.
   - Generates client `.env` and builds multi-stage Docker image using Nginx Alpine.
   - Pushes to Amazon ECR.
   - Generates masked ECR login token on GitHub Actions runner, authenticates Docker on EC2 via SSH environment variables, and deploys container to EC2 instance with `-p 3000:80` (`--restart always`).
3. **[deploy-mongo.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/deploy-mongo.yml):**
   - Manual `workflow_dispatch` job to deploy MongoDB container to the EC2 instance.

---

## 7. Common Pitfalls & Troubleshooting

1. **Port Mismatch (3001 vs 5000 in Docker):**
   - Notice that [server/docker-compose.yml](file:///w:/shubham/personal/Realtime-Chat-App/server/docker-compose.yml#L9) and [aws-deploy-server.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/aws-deploy-server.yml) expose the server at host port `3001` (`-p 3001:5000`). If running under Docker, ensure `REACT_APP_API_URL` points to port `3001` rather than `5000`.
2. **CORS Errors During Development:**
   - If the client is hosted on a non-standard port or hostname (e.g. `127.0.0.1` vs `localhost`), ensure `ALLOWED_ORIGINS` in `server/.env` includes that origin.
3. **MongoDB Linux Kernel Incompatibility (SERVER-121912):**
   - On hosts running Linux kernel versions 6.19 through 7.0.13, MongoDB's bundled TCMalloc conflicts with the kernel's `rseq` ABI. If encountering startup crashes or the `validateRseqKernelCompat` fatal error, pin to `mongo:7` and supply the environment variable `GLIBC_TUNABLES=glibc.pthread.rseq=1`.
