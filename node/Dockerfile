FROM node:14-alpine

RUN mkdir -p /home/node/app && chown -R node:node /home/node

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

CMD [ "node", "server.js" ]
