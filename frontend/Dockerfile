FROM node:18-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./

RUN npm install

COPY --chown=node:node . .

RUN chown -R node:node /app

EXPOSE 3000

USER node

CMD ["npm", "start"]
