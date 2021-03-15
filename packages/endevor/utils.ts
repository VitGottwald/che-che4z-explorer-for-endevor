import { URL } from 'url';
import {
  EndevorServiceProtocol,
  EndevorStageNumber,
  EndevorUrl,
} from './_doc/Endevor';

export const toVersion2Api = (basePath: string) =>
  basePath.includes('EndevorService/rest') ||
  basePath.includes('EndevorService/api/v1')
    ? '/EndevorService/api/v2/'
    : basePath;

export const toEndevorProtocol = (
  protocol: string
): EndevorServiceProtocol | undefined => {
  if (protocol === 'http') return protocol;
  if (protocol === 'http:') return 'http';
  if (protocol === 'https') return protocol;
  if (protocol === 'https:') return 'https';
  return undefined;
};

export const toBaseUrl = (endevorUrl: EndevorUrl): string => {
  return (
    endevorUrl.protocol +
    '://' +
    endevorUrl.hostname +
    ':' +
    endevorUrl.port +
    endevorUrl.basePath
  );
};

export const fromBaseUrl = (baseUrl: string): EndevorUrl => {
  const { protocol, hostname, port, pathname } = new URL(baseUrl);
  const defaultProtocol = 'http';
  return {
    protocol: toEndevorProtocol(protocol) ?? defaultProtocol,
    hostname,
    port: parseInt(port),
    basePath: pathname,
  };
};

export const toEndevorStageNumber = (
  value: string | number
): EndevorStageNumber | undefined => {
  if (value.toString() === '1') return '1';
  if (value.toString() === '2') return '2';
  return undefined;
};

export const fromStageNumber = (
  value: EndevorStageNumber | undefined
): number => {
  const defaultStageNumber = 1;
  return value ? parseInt(value) : defaultStageNumber;
};

export const isDefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};
