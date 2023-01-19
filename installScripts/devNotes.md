Mongo Running in a container for dev
Run WSL execute this command and make an alias for mongo in c:\windows\system32\drivers\etc\hosts

or Docker for Desktop creates a alias in host for host.docker.internal

```
hostname -I | cut -f 1 -d ' '

```

```
docker exec -it uisptools sh


```

```
docker exec -it unms-nginx sh

vi /usr/local/openresty/nginx/templates/conf.d/unms+ucrm-https+wss.conf.template

  location /uisptools/ {
    allow all;
    proxy_pass       http://uisptools:49080;
  }
```

```
docker-compose -p "unms" -f "docker-compose.yml" down
docker stop unms
docker stop ucrm
docker stop unms-netflow
docker stop unms-rabbitmq
docker stop unms-siridb
docker stop unms-nginx
docker stop unms-postgres
docker stop unms-fluentd
docker stop uisptools_mongodb
docker stop uisptools

docker rm unms
docker rm ucrm
docker rm unms-netflow
docker rm unms-rabbitmq
docker rm unms-siridb
docker rm unms-nginx
docker rm unms-postgres
docker rm unms-fluentd
docker rm uisptools_mongodb
docker rm uisptools

docker network prune
#docker network rm app_internal
#docker network rm app_public

docker-compose up -d
```


UISP is using ngix running in docker to use same url for CRM and UISP 

```
sudo docker ps 

```

Results 
```
 ubnt/unms-nginx:1.4.7      "/entrypoint.sh open…"   4 days ago   Up 3 minutes                      0.0.0.0:80-81->80-81/tcp, :::80-81->80-81/tcp, 0.0.0.0:443->443/tcp, :::443->443/tcp   unms-ngin
```

```
sudo docker container inspect unms-nginx
```

```
/usr/bin/dumb-init

 "ResolvConfPath": "/var/lib/docker/containers/cd2c2d5fe0f9009134a81853049f7b07c8ff95f6925ea9f3dc0c35ec920a7f5d/resolv.conf",
        "HostnamePath": "/var/lib/docker/containers/cd2c2d5fe0f9009134a81853049f7b07c8ff95f6925ea9f3dc0c35ec920a7f5d/hostname",
        "HostsPath": "/var/lib/docker/containers/cd2c2d5fe0f9009134a81853049f7b07c8ff95f6925ea9f3dc0c35ec920a7f5d/hosts"

        /usr/local/openresty

        /home/unms/app/docker-compose.yml
        sudo docker container export -o /home/adevries/unms-nginx unms-nginx.tar

        unms-ngix/usr/local/openresty/nginx/conf/conf.d


 "Mounts": [
            {
                "Type": "bind",
                "Source": "/home/unms/data/cert",
                "Destination": "/cert",
                "Mode": "rw",
                "RW": true,
                "Propagation": "rprivate"
            },
            {
                "Type": "bind",
                "Source": "/etc/certificates",
                "Destination": "/usercert",
                "Mode": "ro",
                "RW": false,
                "Propagation": "rprivate"
            },
            {
                "Type": "bind",
                "Source": "/home/unms/data/firmwares",
                "Destination": "/www/firmwares",
                "Mode": "rw",
                "RW": true,
                "Propagation": "rprivate"
            }
        ],

```    