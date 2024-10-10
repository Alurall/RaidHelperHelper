FROM node:alpine
COPY ./src /home/
WORKDIR /home
RUN npm install
CMD ["node", "main.js"]