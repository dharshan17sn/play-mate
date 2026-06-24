# Use the official Bun image
FROM oven/sh-bun:1.1-slim AS base
WORKDIR /usr/src/app

# Install dependencies (production only)
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy production dependencies and source code
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY . .

# Generate Prisma Client
RUN bun run db:generate

# Expose the API port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production

# Run the server
CMD [ "bun", "run", "src/index.ts" ]
