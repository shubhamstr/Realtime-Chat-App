# Realtime Chat App

A realtime chat application built with React, Socket.IO, Express, and MySQL. Users can join a shared chat room, send live messages, and keep a simple message history backed by a database.

## Features

- Realtime messaging with Socket.IO
- Username-based login and room creation
- Shared chat room links
- Message history stored in MySQL
- User profile and notification update APIs

## Tech Stack

- Frontend: React, Redux Toolkit, Material UI, Chat Scope UI Kit
- Backend: Node.js, Express, Socket.IO
- Database: MySQL

## Project Structure

- `client/` - React frontend
- `server/` - Express and Socket.IO backend

## Prerequisites

- Node.js 16+ recommended
- MySQL server
- npm

## Setup

### 1. Configure the server

Create `server/.env` with values similar to:

```env
PORT=5000
JWT_SECRET_KEY=socket_secret_chat
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=socket_chat
```

Import the database schema from:

`server/db/socket_chat.sql`

### 2. Configure the client

The client uses the backend at `http://localhost:5000` by default. If needed, update:

`client/src/constants.js`

Example:

```js
const BASE_URL = 'http://localhost:5000';
const CLIENT_URL = 'http://localhost:3000';
```

### 3. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 4. Run the app

In one terminal:

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm start
```

## Available Scripts

### Client

- `npm start` - Start the React development server
- `npm run build` - Create a production build
- `npm test` - Run the test runner

### Server

- `npm start` - Start the backend server
- `npm run dev` - Start the backend with nodemon

## API Notes

The backend exposes routes for:

- `/auth` - Login and registration
- `/users` - User lookup and profile updates
- `/chat` - Message history and message insertions

## Realtime Events

Socket events used by the app include:

- `connected`
- `joinRoom`
- `message`

## Notes

- The client stores the chat token and room URL in local storage.
- The app is set up for local development by default.
- A production backend URL is already commented in `client/src/constants.js` if you want to switch environments later.
