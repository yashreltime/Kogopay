FROM node:17-alpine3.14 as builder
WORKDIR /usr/app
RUN chmod -R 777 /usr/app
COPY package.json .
RUN npm install
RUN npm install --global rimraf
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]