# Build stage: Node for Vite/React (shared package lives at ../../packages from apps/web)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared package and web app so path alias ../../packages/shared resolves
COPY packages/ packages/
COPY apps/web/ apps/web/

WORKDIR /app/apps/web

RUN npm ci
RUN npx vite build

# Serve stage
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
