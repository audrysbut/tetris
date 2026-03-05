# Build stage
FROM denoland/deno:latest AS builder

WORKDIR /app

COPY deno.json .
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

WORKDIR /app/apps/web

RUN deno install
RUN deno task build

# Serve stage
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
