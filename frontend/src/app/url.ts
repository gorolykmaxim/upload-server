import {environment} from '../environments/environment';

export function getHost(): string {
  return environment.production ? location.host : `${location.hostname}:8090`;
}
