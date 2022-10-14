# UISP-Tools

UISP-Tools is an open-source node server that extend the functionality of [UISP](https://https://uisp.ui.com/). 
This Node.js application runs in a seperate docker instance will interface to your instance of UISP using an Application Key using the UISP API's. [Read more](https://ucrm.docs.apiary.io/#).

UISP-Tools is compatible with UCRM 2.10.0+

## How does it work?
* install uisptools using docker-compose 
* using a web browser connect to UISPTools docker container [http://127.0.0.0](http://127.0.0.0)
* using a web browser login to the admin page using default username and password "admin" and "UISPToolsPassword" [http://127.0.0.0/admin](http://127.0.0.0/admin)
 * That's it, .


```
# sudo groupadd docker
# sudo usermod -aG docker $USER
# newgrp docker  or reboot/logout-login
sudo mkdir -p /usr/src/uisptools
sudo chown "$USER":"docker" /usr/src/uisptools
mkdir -p /usr/src/uisptools/config
sudo chown "$USER":"docker" /usr/src/uisptools/config
mkdir -p /usr/src/uisptools/logs
sudo chown "$USER":"docker" /usr/src/uisptools/logs
mkdir -p /usr/src/uisptools/data/mongodb
sudo chown "$USER":"docker" /usr/src/uisptools/data
sudo chown "$USER":"docker" /usr/src/uisptools/data/mongodb

mkdir ~/uisptools
mkdir ~/uisptools/dockerCompose
mkdir ~/uisptools/mongodb
mkdir ~/uisptools/mongodb/docker-entrypoint-initdb.d

#Link the exsiting certs in the server 
sudo ln -s /home/unms/data/cert/live/billing.example.com/fullchain.pem /usr/src/uisptools/config/server.cert
sudo ln -s /home/unms/data/cert/live/billing.example.com/privkey.pem /usr/src/uisptools/config/server.key

wget -c https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/mongodb/docker-entrypoint-initdb.d/createDatabase.js -O ~/uisptools/mongodb/docker-entrypoint-initdb.d/createDatabase.js

wget -c https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/mongodb/docker-entrypoint-initdb.d/initWebServerPages.js -O ~/uisptools/mongodb/docker-entrypoint-initdb.d/initWebServerPages.js

wget -c https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/dockerCompose/docker-compose.yml -O ~/uisptools/dockerCompose/docker-compose.yml
sudo docker-compose -f ~/uisptools/dockerCompose/docker-compose.yml up --force-recreate -d

```



sudo docker pull docker.pkg.github.com/jon-gr/webstream/appliance_sqm_sip:latest



## How can I contribute?
* This application are under GNU General Public License v3.0 enabling anyone to contribute any upgrades or create whole new ones
* Propose any Pull Request in this repository.
* See the documentation below.

## Disclaimer 
The software is provided "as is", without any warranty of any kind. Please read [LICENSE](https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/LICENSE) for further details
