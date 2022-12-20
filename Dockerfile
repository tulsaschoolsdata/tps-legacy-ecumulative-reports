FROM node:18.12.1-bullseye-slim

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
RUN apt-get update && apt-get install -y \
    chromium \
    wkhtmltopdf \
  && rm -rf /var/lib/apt/lists/*

USER node

WORKDIR /home/node/app
COPY --chown=node . .
RUN npm ci && npx prisma generate
