FROM node:8
COPY *.js ./
COPY *.json ./
COPY views/ ./views
COPY *.exe ./
RUN npm install
ENTRYPOINT ["npm", "start"]
