## Pre Requisitos

### Software

Estos servicios estan disponibles en contenedores docker, por lo cual es necesario tener la ultima version vigente del mismo, en especial porque viene con el plugin de `compose` , el archivo esta enfocado en la version `3.9` del manifiesto de `docker compose`, por lo demas es agnostico a el sistema operativo que esta, pero siempre se recomienda usar algun servidor unix para el manejo de permisos a nivel de usuario.

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

### Archivos credenciales básicas



### Archivo de secretos



### Archivo estatico de Traefik

`Traefik` tiene 2 tipos de configuracion, la estatica y la dinamica, la primera es la core del servicio en si, la segunda corresponde a los balanceadores y otras cosas que seran especificadas en su momento, lamentablemente no todos las variables del archivo estatico pueden ser parametrizadas para correr correctamente `Traefik`, pero se tiene que crear un archivo estatico en la siguiente ruta: `$DOPT/traefik/traefik.yml` , este debe traer la siguiente configuracion:

```yaml
api:
  insecure: true
  dashboard: true

log:
  filepath: /logs/traefik.log
  level: {env.LOG_LEVEL}

accessLog:
  filePath: /log/access.log
  bufferingSize: 100
  filters:
    statusCodes: 204-299,400-499,500-599

providers:
  docker:
    endpoint: unix:///var/run/docker.sock
    exposedByDefault: false
    watch: true
    network: proxy
    swarmMode: false
  file:
    directory: /rules
    watch: true

certificatesResolvers:
  dns-cloudflare:
    acme:
      email: '' # add your dns email. must be the same as dot env file
      storage: /acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - 1.1.1.1:53
          - 1.1.0.0.1:53
        delayBeforeCheck: 90

global:
  checkNewVersion: true
  sendAnonymousUsage: false

entryPoints:
  http:
    address: !!str ':80'
    http:
      redirections:
        entrypoint:
          to: https
          scheme: https
          permanent: true
  https:
    address: !!str ':443'
    forwardedHeaders:
      trustedIPS: [ {env.TRUSTED_IPS} ]
    http:
      tls:
        options: tls-opts@file
        certresolver: dns-cloudflare
        domains:
          - main: !!str '' # must be inputed as example.tld
            sans: !!str '' # must be inputed as *.example.tld
  traefik:
    address: !!str ':8080'
```

hay que tener en consideracion que en la linea 29 se debe introducir el mismo email de la cuenta de cloudflare, y en las lineas 60 y 61 los registros DNS `A` y `CNAME` respectivamente, extrañamente, todo lo demas puede pasar por parametros o variables de entorno del mismo contenedor.

### Archivo DNSmasq

en la ruta `$DOPT/dnsmasq/` se encuentra el archivo `dnsmasq.conf` el cual debe ser actualizado para que incluya informacion escencial para el funcionamiento de los servicios.

```bash
port=53
domain-needed
bogus-priv

no-hosts

no-resolv
strict-order
server=8.8.8.8
server=8.8.4.4
server=1.1.1.1
server=1.0.0.1

expand-hosts
# changed domain from .docker to .dev.home
domain=

#log all dns queries
log-queries

address=
address=
```

en la linea 15 se debe agregar el dominio del registro A del DNS

```bash
domain=example.tld
```

en las ultimas dos lineas se deben agregar el dominio y las ip de la maquina host que va a tener los servicios, la IP debe ser de la red local,  esta dos veces por que se recomienda tener tanto la ipv4 como la ipv6, un ejemplo seria:

```bash
address=/example.tld/192.168.1.2
address=/example.tld/aaaa::bbbb:cccc:dddd:eeee

```

el uso de las direcciones ipv6 resuelve los provemas de conectividad que podrian pasar con versiones nuevas de safari y iOS ya que el private relay funciona a nivel de ipv6, segun documentacion de DNSmasq

### Pull y build de contenedores

Si, antes de usar los servicios se debe realizar un pull de los contenedores, esto debido a que no tenemos configurados el servidor DNS local.

```bash
docker compose pull # para traer todos los servicios y dejarlos disponibles para su uso 
docker compose build # para crear los contenedores que no son traidos desde el hub de docker (necesario para el servidor DNSmasq)
```

_esto tambien es util para poder tener los servicios de `Plex` que va a ser descrito mas adelante._

### Servidor DNSmasq

para que todo resulte desde la red, se ha disponibilizado un servidor DNSmasq que resuelve los dominios y subdominios creados por el balanceador `Traefik` lo que si, es un poco trabajoso de ponerlo a ejecutar desde primera instancia, se deben seguir los siguientes pasos, siempre y cuando tu router permita configurar el servidor DNS por defecto

#### Pasos a seguir

##### levantar los servicios y la red privada de los contenedores

algo tan simple como ejecutar 

```bash
docker compose up -d # -d para que sea en modo detached, donde podemos cerrar la consola posteriormente sin perder la ejecucion
```

##### configurar servidor dns

esto varia de router en router, tienes que ver en algun tutorial como cambiar esa configuracion, el servicio de DNS debe ser solo uno y debe apuntar a la IP interna del equipo donde estan activos los servicios. Se recomienda usar IP estatica o reservada para ese equipo .

##### puertos

para el correcto funcionamiento del servicio, en el servidor deben estar habilitados los puertos 53/tcp, 53/udp, ademas de los standard http y https (80, 443) y los especiales para cada servicio que seran listados en cada descripcion de ellos.

El servicio DNSmasq esta configurado para que resuelva las direcciones internas, por lo que si necesita resolver alguna direccion fuera de la red, este va a redireccionar a los servidores de cloudflare y google (al azar) para obtener las paginas web. en si esto tambien es un foco de privacidad, ya que de esta manera tu ISP no deberia tener registro en tu router de las paginas que visitan en tu red. ademas asi puedes visitar los dominios de los servicios desde cualquier equipo en tu red local y si deseas configurar algo mas es mas facil un DNS, porque las ips de los contenedores, que si bien estan expuestas, estas cambian efimeramente junto al contendor (si lo reinicias es bastante probable que no vuelva a ser la misma ip).

##### reiniciar contendores

si, se deben reiniciar los contenedores docker, para que tomen la configuracion del DNSmasq, por lo mismo primero se piden todos estos pasos, porque al tener abajo dnsmasq no puedes hacer pull o build de los contenedores, ya que intentan primero resolver dns a un servidor que no existe.

### Nota

si tienes un servidor dns aparte, puedes omitir todos estos pasos y pasar directamente a levantar y configurar tus servicios.