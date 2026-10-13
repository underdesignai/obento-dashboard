FROM node:22-slim

WORKDIR /app

# Install openssl for Prisma engines
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --include=dev

COPY . .

ENV NEXT_PUBLIC_PORT=3627
ENV PORT=3627

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3627

CMD ["npm", "run", "start"]
