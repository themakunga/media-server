# media-server


this is prepared to work with Cloudflare DNS resolver to get Certificates, first of all you need to get sure the firts A record have to be DNS Only (gray) and have a CNAME * ponting to the A record


then you need to create the `acme.json` file in `${DAPPDATA}/traefik/acme/` and change the permission as `chmod 600 acme.json`

then fill the env vars and you can run the container with `docker compose up -d` 
