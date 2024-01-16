FROM alpine:3.19

RUN apk add --no-cache dnsmasq-dnssec

EXPOSE 53/udp

EXPOSE 53/tcp

ENTRYPOINT ["dnsmasq", "--no-daemon", "--user=dnsmasq", "--group=dnsmasq"]
