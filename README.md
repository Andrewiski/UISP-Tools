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
mkdir -p /usr/src/uisptools/data/mongodb
sudo chown "$USER":"docker" /usr/src/uisptools/data/mongodb
wget -c https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/docker-compose.yml -o /usr/src/uisptools/docker-compose.yml
docker-compose -f /usr/src/uisptools/docker-compose.yml up

```



docker pull docker.pkg.github.com/jon-gr/webstream/appliance_sqm_sip:latest



## How can I contribute?
* This application are under GNU General Public License v3.0 enabling anyone to contribute any upgrades or create whole new ones
* Propose any Pull Request in this repository.
* See the documentation below.

## Disclaimer 
The software is provided "as is", without any warranty of any kind. Please read [LICENSE](https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/LICENSE) for further details
