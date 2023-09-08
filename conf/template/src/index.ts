import yml from 'js-yaml';
import fs from 'node:fs';
import Mustache from 'mustache';

const readFileYml = (path: string): any => {
  const file = fs.readFileSync(path, 'utf8');

  return yml.load(file);
}

interface IRender {
  destination: string;
  subdomain: string;
  hostname: string;
}

const renderTemplate = (payload: IRender) => {
  const file_rendered = `/rendered/${payload.hostname}.nginx.conf`;
  const template = fs.readFileSync('/template/template.nginx.conf', 'utf8');

  const rendered = Mustache.render(template, payload);

  fs.writeFileSync(file_rendered, rendered);

  return true;
}

interface IService {
  image: string,
  container_name: string;
  hostname?: string;
  ports?: string[];
}

interface IComposer {
  version: string;
  services: IService[];
  networks?: any;
}

const exceptions: string[] = [
  'watchtower',
  'reverse_proxy',
  'minica',
  'template',
];

const loadCompose = () => {
  const {
    DOMAIN: domain,
  } = process.env;

  const { services: manifest }: IComposer = readFileYml('/files/docker-compose.yml');
  const list = Object.keys(manifest).filter((item) => (!exceptions.includes(item)))

  console.log(list);


  list.forEach((val: string) => {
    manifest[val].expose.map((expose: string) => {
      const sPort = expose;

      const destination = `${manifest[val].hostname}:${sPort}`;
      const subdomain = `${manifest[val].hostname}.${domain}`;

      renderTemplate({ destination, subdomain, hostname: manifest[val].hostname });

    });
  });
  process.exit(0);
}

loadCompose();
