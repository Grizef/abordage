# syntax=docker/dockerfile:1
# Astro SSR (adapter Node standalone). Node >= 22.12 requis (sanitize-html, require(esm)).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Astro inscrit les variables du .env dans dist/ au build : le .env arrive en secret
# de build (jamais dans une couche), mais l'image finale contient ces valeurs → ne jamais la publier.
RUN --mount=type=secret,id=env,target=/app/.env npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --start-interval=2s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/api/health > /dev/null || exit 1
CMD ["node", "dist/server/entry.mjs"]
