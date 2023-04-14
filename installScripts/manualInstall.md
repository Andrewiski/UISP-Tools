'''
sudo passwd unms

#Login as unms
sudo su unms 

cd ~
cd app
./unms-cli stop
# append uisp_tools docker Compose to docker-compose.yml
# add uisptools as a depends on to unms service so starts and stops with unms
# - uisptools
nano  /home/unms/app/docker-compose.yml


'''

#Edit nginx template to add uisptools

```
docker exec -it unms-nginx sh
ls /usr/local/openresty/nginx/conf/conf.d
#edit the template for file listed
vi /usr/local/openresty/nginx/templates/conf.d/unms+ucrm-https+wss.conf.template

  location /uisptools/ {
    allow all;
    proxy_pass       http://uisptools:49080;
  }

docker restart unms-nginx
```

#now you should be able to visit unms url /uisptools