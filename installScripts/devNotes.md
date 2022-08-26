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


/usr/bin/dumb-init

 "ResolvConfPath": "/var/lib/docker/containers/cd2c2d5fe0f9009134a81853049f7b07c8ff95f6925ea9f3dc0c35ec920a7f5d/resolv.conf",
        "HostnamePath": "/var/lib/docker/containers/cd2c2d5fe0f9009134a81853049f7b07c8ff95f6925ea9f3dc0c35ec920a7f5d/hostname",
        "HostsPath": "/var/lib/docker/containers/cd2c2d5fe0f9009134a81853049f7b07c8ff95f6925ea9f3dc0c35ec920a7f5d/hosts"

        /usr/local/openresty

        /home/unms/app/docker-compose.yml
        docker container export -o /home/adevries/unms-nginx unms-nginx.tar

        unms-ngix/usr/local/openresty/nginx/conf/conf.d

    