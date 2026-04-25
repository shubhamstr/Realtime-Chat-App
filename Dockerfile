FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server ./server

WORKDIR /app/server

EXPOSE 5000

CMD ["npm", "start"]
