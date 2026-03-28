FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

COPY packages ./packages
COPY apps ./apps

RUN npm install

WORKDIR /app/apps/course-service

EXPOSE 8001

ENV NODE_ENV=production

CMD ["node", "src/index.js"]