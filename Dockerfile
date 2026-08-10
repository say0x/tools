FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: der postinstall-Hook (`prisma generate`) braucht prisma/schema.prisma,
# das hier noch nicht kopiert ist. Generiert wird stattdessen explizit in der builder-Stage,
# nachdem der volle Source-Tree kopiert wurde.
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

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
# prisma/seed.ts importiert den generierten Client aus src/generated/prisma per
# Relativpfad und wird von tsx zur Laufzeit (nicht vom Next-Build) ausgeführt,
# braucht die Datei also zusätzlich hier.
COPY --from=builder /app/src/generated ./src/generated

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
