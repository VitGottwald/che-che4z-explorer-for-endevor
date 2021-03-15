import * as vscode from 'vscode';
import { URL } from 'url';
import { EndevorCredential } from '@local/endevor/_doc/Credential';
import { EndevorElement, EndevorLocation } from '@local/endevor/_doc/Endevor';

export interface Parms {
  location: EndevorLocation;
  credential: EndevorCredential;
  element: EndevorElement;
}

interface QueryObject {
  protocol: string;
  configuration: string;
  credential: EndevorCredential;
  element: EndevorElement;
  pathname: string;
  host: string;
}

export const toVirtualDocUri = (URI_SCHEME: string) => ({
  location: { baseUrl, configuration },
  credential,
  element,
}: Parms): vscode.Uri => {
  const { host, protocol, pathname } = new URL(baseUrl);
  const queryObject: QueryObject = {
    protocol,
    configuration,
    credential,
    element,
    pathname,
    host,
  };

  return vscode.Uri.parse('').with({
    scheme: `${URI_SCHEME}`,
    // `path` is used to show nice file label in text editor
    path: `/${element.elmName}.${element.typeName.toLowerCase()}`,
    query: JSON.stringify(queryObject),
  });
};

export const fromVirtualDocUri = (uri: vscode.Uri): Parms => {
  const {
    protocol,
    configuration,
    credential,
    element,
    pathname,
    host,
  }: QueryObject = JSON.parse(uri.query);

  return {
    location: {
      baseUrl: `${protocol}//${host}${pathname}`,
      configuration,
    },
    credential,
    element,
  };
};
