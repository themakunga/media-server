# Servidor Multimedia y Laboratorio

_creado para mantener organizados los servicios que son mas comunes en un laboratorio/media center._

[toc]

## Pre Requisitos

### Cloudflare DNS

En cloudflare se deben crear 2 registros DNS, un tipo `A` con la IP publica de tu red,  se puede obtener con el siguiente comando `curl icanhazip.com` el numero obtenido tiene que ser al registro `A` al DNS base, posteriormente se debe crear un registro `CNAME` con un wildcard al dominio ejemplo: `*.example.tld`. Se debe tener en cuenta que hay que cambiar el `Proxy status` de Cloudflare en esos registros a **DNS only** 

![image-20240117161350670](https://p.ipic.vip/sp645n.png)



no es necesario preocuparse de los registros posteriormente si tu IP es dinamica, ya que el mismo resolvedor de `Traefik` se encarga de revisarlo y actualizarlo cada 3 horas, eso no significa que tus proyectos van a estar accesibles desde fuera de tu red, esto es solo para obtener el certificado SSL y no tener las alertas de tu navegador.



### Archivo de Variables de entorno

Antes de si quiera ejecutar se debe crear un archivo `.env` en el directorio principal del proyecto, con las siguientes variables, adaptadas a tus necesidades, _se recomienda apuntar la variable $DMEDIA a un storage de gran capacidad, que va a ser el lugar donde se almacenen tanto las descargas mientras estan activas como los archivos una vez esten disponibles y organizados por los servicios_ 

```bash
# Core environments
TZ='America/Santiago' # change it for your timezone, this prevent inconsistency on moving files
PUID='1000'  # your main user ID, it must have docker permissions
PGID='998' # your docker group permission id
UMASK='0022'
LOG_LEVEL='info' # info,debug,error,trace,warn

# Directories, use relative dirs if you know where are going to be
DAPPDATA='./appdata'
DMODULES='./modules'
DCUSTOM='./custom'
DSCRIPTS='./scripts'
DSECRETS='./secrets'
DSHARED='./shared'
DMEDIA='./media'
DLOGS='./logs'
DOPT='./opt'

# DNS Resolver / Traefik
DOMAIN=""
SUBNET='192.168.90.0/24'
LOCAL_IPS='127.0.0.1/32,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12'
CLOUDFLARE_IPS='173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22'
TRAEFIK_VERSION='2.10.4'
CLOUDFLARE_API_KEY=""
CLOUDFLARE_TOKEN=""
CLOUDFLARE_EMAIL=""
LETSENCRYPT_EMAIL=""


## Services Variables
# WatchTower
WATCHTOWER_CLEANUP=true
WATCHTOWER_INCLUDE_RESTARTING=true
WATCHTOWER_SCHEDULE='0 4 * * *' # every day at 4am CL
WATCHTOWER_ROLLING_RESTART=true

# Plex
PLEX_CLAIM="" 

# MariaDB
MARIADB_PASSWORD=""
MARIADB_BASE_USERNAME=''
MARIADB_BASE_PASSWORD=''
MARIADB_DATABASE='home' # keep this one
ADMINER_DEFAULT_SERVER='home' # same for this

# jellyfin
JELLYFIN_SERVERURL='' # you need to use your domain example: jellyfin.example.tld

# MongoDB
MONGO_ROOT_USERNAME=''
MONGO_ROOT_PASSWORD=''
```

a partir de ahora a los directorios se les referira con su nombre de variable



### Archivo de verificacion de certificados SSL

se debe crear un archivo de certificacion `acme.json` en el directorio de appdata de Traefik, si no este va a ser creado por el contenedor y va a dar error sin levantar el servicio. este debe tener permisos solo de lectura para el usuario del `pid` que esta activando el servicio, el mismo de la variable de entorno `PUID`

```bash
touch $DAPPDATA/traefik/acme.json
chmod 600 $DAPPDATA/traefik/acme.json
```

si el directorio no esta creado, crearlo.





