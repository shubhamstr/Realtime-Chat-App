# Project Overview

## 1. Project Purpose & Summary

The **Realtime Chat App** is a full-stack, room-based instant messaging application designed for lightweight real-time communication. It allows users to log in quickly using only a username, generate or join specific chat rooms via encrypted or shared room IDs, exchange messages and image attachments, see real-time typing indicators, and receive browser and email notifications.

The application features persistent document storage using **MongoDB** via Mongoose.

---

## 2. Business Domain & Use Cases

- **Domain:** Real-time communications, instant messaging, ephemeral/collaboration rooms.
- **Primary Use Cases:**
  - Ad-hoc chat rooms: Users can create a room, copy a shareable link, and invite others to chat instantly.
  - Lightweight collaboration: Guest-style access without tedious multi-step registration or email verification.
  - Asynchronous notifications: Desktop notifications when the browser tab is idle, and optional email alerts when new messages arrive.
  - Fast, document-oriented persistence with MongoDB.

---

## 3. Users & Personas

- **Guest / End User:** A participant who provides a username to enter a chat room. They can send and delete their own messages, attach images, toggle browser notifications, and configure an email address for message alerts.
- **Room Initiator:** A user who initiates a session without an existing room URL, receiving an auto-generated URL-safe room token that can be shared with peers.

---

## 4. Major Functionality

1. **Username Authentication & Room Link Creation:**
   - Single-field username login.
   - Generates an AES-256 encrypted URL-safe room token if no room ID is provided.
   - Issues a JSON Web Token (JWT) containing user ID and basic claims.
2. **Real-time Messaging:**
   - Socket.IO-based duplex communication for live message broadcast within isolated rooms.
   - Optimistic message rendering on the client with server persistence fallback.
3. **Message History & Media:**
   - Persistent message history retrieved via REST API when entering a room.
   - Support for image attachments encoded as Base64 Data URLs (up to 2MB).
4. **Interactive Collaboration Features:**
   - Real-time typing indicators with auto-cancel debounce timers.
   - Context-menu message deletion with synchronized socket broadcast to all room members.
   - Native browser desktop notifications using the HTML5 Notification API.
   - Notification settings modal allowing users to save email alert preferences.
   - Server-side email notifications dispatched via Nodemailer SMTP upon message receipt.
5. **MongoDB Persistence:**
   - Persistent database layer in [server/db/index.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/index.js) and [server/db/mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js).

---

## 5. Current Project Status

- **Status:** Functional MVP / Prototype with active CI/CD deployment workflows.
- **Maturity Level:** Early production prototype deployed to Amazon Web Services (AWS).
- **Template Heritage:**
  - The client was originated from Devias Material Dashboard (`react-material-dashboard` in [client/package.json](file:///w:/shubham/personal/Realtime-Chat-App/client/package.json)), but has been heavily simplified to focus exclusively on Login and Chat views.
  - Unused dependencies from the template remain in `package.json` (e.g., `chart.js`, `react-chartjs-2`).
- **Core Strengths:**
  - Clean separation of database providers.
  - Responsive, modern Chat UI using `@chatscope/chat-ui-kit-react`.
  - Ready-to-use Docker and GitHub Actions workflows for AWS ECR and EC2 deployment.
- **High-Priority Needs:**
  - JWT authorization middleware on backend routes (currently unauthenticated).
  - Password hashing and proper authentication if accounts are to be protected.
  - Static AES encryption key configuration (server currently creates random AES keys on boot, causing encrypted URL mismatch across restarts).
