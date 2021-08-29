FROM node:12.14-alpine3.11 

# get the latest openssl
#RUN apt-get update
#RUN apt-get install -y openssl
RUN apk update
RUN apk add openssl

# Create app directory
WORKDIR /usr/src/UISPTools
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
# Bundle app source
COPY . .
EXPOSE 1336 1337

CMD [ "npm", "run", "start" ]
