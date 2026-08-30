FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    ffmpeg \
  && curl -fsSL \
    "https://github.com/acoustid/chromaprint/releases/download/v1.5.1/chromaprint-fpcalc-1.5.1-linux-x86_64.tar.gz" \
    -o /tmp/chromaprint.tar.gz \
  && tar -xzf /tmp/chromaprint.tar.gz -C /tmp \
  && mv /tmp/chromaprint-fpcalc-1.5.1-linux-x86_64/fpcalc /usr/local/bin/fpcalc \
  && chmod +x /usr/local/bin/fpcalc \
  && rm -rf /tmp/chromaprint.tar.gz /tmp/chromaprint-fpcalc-1.5.1-linux-x86_64 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
