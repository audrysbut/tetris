FROM denoland/deno:latest

WORKDIR /app

COPY deno.json .
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

WORKDIR /app/apps/api

RUN deno cache main.ts

EXPOSE 3000

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
