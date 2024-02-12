FROM node:16.20.2-alpine3.17 

# get the latest openssl
#RUN apt-get update
#RUN apt-get install -y openssl
RUN apk update
RUN apk add openssl

# Update args in docker-compose.yaml to set the UID/GID of the "node" user.
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then groupmod --gid $USER_GID node && usermod --uid $USER_UID --gid $USER_GID node; fi

# Create app directory
WORKDIR /usr/src/uisptools
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN mkdir -p /usr/src/uisptools/config

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
# Bundle app source
COPY . .
EXPOSE 49080 49443

CMD [ "npm", "run", "start" ]
