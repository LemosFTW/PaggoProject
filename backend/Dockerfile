# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /api

COPY . .
RUN rm -rf node_modules
RUN rm -rf dist
RUN npm i
RUN rm .env

RUN touch .env
RUN echo "DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres" >> .env
RUN echo "PORT=" >> .env
RUN echo "NODE_ENV=" >> .env
RUN echo "JWT_SECRET=" >> .env
RUN echo "REFRESH_TOKEN_SECRET=" >> .env
RUN echo "JWT_EXPIRES_IN=" >> .env
RUN echo "JWT_REFRESH_SECRET=" >> .env
RUN echo "JWT_REFRESH_EXPIRES_IN=" >> .env
RUN echo "AWS_ACCESS_KEY_ID= " >> .env
RUN echo "AWS_SECRET_ACCESS_KEY= " >> .env
RUN echo "AWS_REGION=" >> .env
RUN echo "AWS_S3_BUCKET =" >> .env
RUN echo "GEMINI_API_KEY=" >> .env


RUN npx prisma generate

RUN npm run build

EXPOSE 3000


CMD ["node", "dist/src/main"]