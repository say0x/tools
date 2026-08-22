# syntax=docker/dockerfile:1
# Cache-Mounts (siehe unten) brauchen die BuildKit-Dockerfile-Syntax explizit.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: der postinstall-Hook (`prisma generate`) braucht prisma/schema.prisma,
# das hier noch nicht kopiert ist. Generiert wird stattdessen explizit in der builder-Stage,
# nachdem der volle Source-Tree kopiert wurde.
# Cache-Mount für npms globalen Cache: übersteht `docker builder prune`/`docker system prune`
# nicht als Layer, sondern als eigener BuildKit-Cache — beschleunigt npm ci spürbar, wenn
# package-lock.json sich ändert (Layer-Cache allein greift dann nicht mehr).
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Next.js' eigener Build-Cache (.next/cache: Turbopack/Webpack-Kompilat, nicht der
# App-Output) bleibt normalerweise nicht zwischen Image-Builds erhalten, da jede Stage
# in einem frischen Container läuft — der Cache-Mount reicht ihn über Builds hinweg
# weiter und macht wiederholte "docker compose up -d --build" nach Code-Änderungen
# spürbar schneller (inkrementeller statt kompletter Rebuild).
RUN --mount=type=cache,target=/app/.next/cache npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone output: nur die getracten Dateien + minimaler server.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma CLI + Schema/Migrationen für "migrate deploy" im Entrypoint (und für
# das manuelle "npx prisma db seed"). Bewusst das komplette node_modules aus
# der builder-Stage statt einzelner Pakete: die Prisma-CLI zieht transitive
# Abhängigkeiten (z.B. @prisma/config -> effect) aus node_modules-Wurzeln, die
# nicht unter prisma/ oder @prisma/ liegen — gezieltes Cherry-Picking bricht
# dadurch unvorhersehbar. Kostet etwas Image-Größe, ist aber für ein internes
# Homelab-Tool unkritisch.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
# prisma/seed.ts und scripts/import-objekte.ts werden von tsx zur Laufzeit
# (nicht vom Next-Build) ausgeführt und importieren u.a. aus src/generated,
# src/server und src/lib per @/-Alias — brauchen daher den kompletten
# Source-Tree + tsconfig.json (für die Alias-Auflösung) zusätzlich zum
# Next-Standalone-Output, der nur die für die Web-App getracten Dateien enthält.
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/data ./data

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Smoke-Test: bricht den Build sofort ab, falls die Prisma-CLI im Image nicht
# lauffähig ist (z.B. durch kaputte .bin-Symlinks), statt es erst zur Laufzeit
# als crash-loopender Container zu bemerken.
RUN npx prisma --version

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
