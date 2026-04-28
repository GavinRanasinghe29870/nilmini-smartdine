FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

ARG INTERNAL_UPLOAD_PROXY_URL=http://api-gateway:5000
ENV INTERNAL_UPLOAD_PROXY_URL=$INTERNAL_UPLOAD_PROXY_URL

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]