'''
sudo passwd unms

#Login as unms
sudo su unms 

#UNMS Needs to be running so we can access unms_nginx container to copy templates
#Edit nginx template to add uisptools path

```

docker cp unms-nginx:/usr/local/openresty/nginx/templates /home/unms/data/uisptools/nginx
docker exec -it unms-nginx sh
ls /usr/local/openresty/nginx/conf/conf.d
ls
#edit the host template for file listed as we will remap directy in docker-compose.yml
nano /home/unms/data/uisptools/nginx/templates/conf.d/unms+ucrm-https+wss.conf.template

# Add the following below the location = /{}  block  two spaces in front
  location /uisptools/ {
    allow all;
    proxy_pass       http://uisptools:49080;
  }

```


cd ~
cd app
./unms-cli stop
# append uisp_tools docker Compose to docker-compose.yml
# add uisptools and uisp_mongo as a depends on to unms service so starts and stops with unms
# - uisptools
# - uisptools_mongodb
# need to copy then map nginx templates to host so they don't get overwriten on rebbot
# remap nginx tempaltes to local host template folder created above
# - /home/unms/data/uisptools/nginx/templates:/usr/local/openresty/nginx/templates
nano  /home/unms/app/docker-compose.yml


'''


```


#edit config.json and set APiKeys
nano /home/unms/data/uisptools/config/config.json
#"ucrmAppKey": "",

```

#now you should be able to visit unms url /uisptools


#upgrade Uisptools

```
./unms-cli stop
docker pull andrewiski/uisptools:latest
./unms-cli start
```