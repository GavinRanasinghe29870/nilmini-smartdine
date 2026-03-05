FROM node:22-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

COPY . .

# RUN chmod +x run.sh

EXPOSE 9000

# Start the service
CMD ["npm", "run", "dev"]
