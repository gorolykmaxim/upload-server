FROM node:8
COPY *.js ./
COPY *.json ./
RUN npm install
ENTRYPOINT ["npm", "start"]
