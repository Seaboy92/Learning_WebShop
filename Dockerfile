FROM node:22-alpine

WORKDIR /app

COPY package.json ./package.json
COPY backend ./backend
COPY frontend ./frontend

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
