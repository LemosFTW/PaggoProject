# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /api

COPY . .
RUN rm -rf node_modules
RUN rm -rf dist
RUN npm i
RUN rm .env

RUN touch .env

RUN npx prisma generate

RUN npm run build

EXPOSE 3000


CMD ["node", "dist/src/main"]