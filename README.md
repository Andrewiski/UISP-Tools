# UISP-Tools

UISP-Tools is an open-source node server that extend the functionality of [UISP](https://https://uisp.ui.com/). 
This Node.js application runs in a seperate docker instance will interface to your instance of UISP using an Application Key using the UISP API's. [Read more](https://ucrm.docs.apiary.io/#).

UISP-Tools is compatible with UCRM 2.10.0+

## How does it work?
* uisptools docker services are added to the UISP docker-compose.yaml file that is created during the UISP install process located at /home/unms/app/docker-compose.yml
* next the /uisptools path is added to the unms-nginx conf.d so that it can accessed using the UNMS url  /uisp
* plugins can be added by copying them to the config/plugin folder and adding them to the plugins section of config.json file
* all of the uisptools reside in a completly seperate paths as well as seperate containers so easy to remove and upgrade


## How to install  (Could use some help creating an install.sh script to make this easier)
```
# Create a password for the unms user
sudo passwd unms
#Login as unms as thats the user uisp runs under

#get the unms userid make sure it matches the user in the docker-compose.yml so the container runs as correct user
id -u
#Change the /home/unms/app folder where the docker-compose.yml file resides  it too will have the user id set needs to be the same so updated if not 1001 from my example append file
cd ~/app
# create the uisptools folder using unms user so they have correct permissions
mkdir ~/data/uisptools
mkdir ~/data/uisptools/config
mkdir ~/data/uisptools/config/public
mkdir ~/data/uisptools/config/plugins
mkdir ~/data/uisptools/logs
mkdir ~/data/uisptools/mongodb
mkdir ~/data/uisptools/mongodb/data
mkdir ~/data/uisptools/mongodb/docker-entrypoint-initdb.d
mkdir ~/data/uisptools/nginx/
mkdir ~/data/uisptools/nginx/templates


#copy existing enginx templates to our override folder.
docker cp unms-nginx:/usr/local/openresty/nginx/templates/conf.d/ ~/data/uisptools/nginx/templates/


#copy the mongo db init scripts from github (note this are only ran once and only if there is an empty database  I use Studio 3T as windows mongo Client see below)
wget https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/mongodb/docker-entrypoint-initdb.d/01_createDatabase.js -O ~/data/uisptools/mongodb/docker-entrypoint-initdb.d/01_createDatabase.js
wget https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/mongodb/docker-entrypoint-initdb.d/02_initWebServerPages.js -O ~/data/uisptools/mongodb/docker-entrypoint-initdb.d/02_initWebServerPages.js



#Stop the uisp docker containers
docker-compose down


# append the contents of https://github.com/Andrewiski/UISP-Tools/blob/main/dockerCompose/uisp/docker-compose-append.yml to the end of /home/unms/app/docker-compose.yml
nano docker-compose.yml
#Note that by changing the version of of uisptools in the docker-compose.yml will allow it to be upgraded with a "docker-compose down" followed by a "docker-compose up -d"
#restart  uisp including the uisptools services
#because unms_nginx stores its template in the image a down and up will revert the template back to the docker image
#to prevent this we copy the templates to a local folder make the changes and map them by adding a volume to the uisp_nginx service in docker-compose.yml 
- /home/unms/data/uisptools/nginx/templates/conf.d:/usr/local/openresty/nginx/templates/conf.d

nano ~/data/uisptools/nginx/templates/conf.d/unms-https+wss.conf.template
nano ~/data/uisptools/nginx/templates/conf.d/unms+ucrm-https.conf.template 
nano ~/data/uisptools/nginx/templates/conf.d/unms+ucrm-https+wss.conf.template 

# Append the following to the templates so uisptools is accessable on the /uisptools/ path

  location /uisptools/ {
    allow all;
    proxy_pass       http://uisptools:49080;
  }


docker-compose up -d

```

Should be ablle to get the default website to open by visiting https://uispserver/uisptools


## How to edit the Mongo Database
I use the free Windows app Studio 3T and connect to the mongo instance using ssh and then authentication using the uisptools and password set in docker-compose.yaml. 
Note that username password combo if changed needs to be updated in the /home/unms/uisptools/config/config.json as well in the mongodb url


## Plugins General Usage and Warnings
* Installing uisptools can allow any NMS superadmin to make any nms api call exposed this includes Posts and Deletes via urls using the generic passthrough this can be disabled with a config option.  The user does need to using the uisptools login and have an active short lived access token
* Any plugin can be copied and extended by coping to the config/plugins folder, config/plugins is served before /plugins this way any and all plugins can be extended

## How can I contribute?
* This application are under GNU General Public License v3.0 enabling anyone to contribute any upgrades or create whole new ones
* Propose any Pull Request in this repository.
* See the documentation below.

## Disclaimer 
The software is provided "as is", without any warranty of any kind. Please read [LICENSE](https://raw.githubusercontent.com/Andrewiski/UISP-Tools/main/LICENSE) for further details
