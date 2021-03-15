import * as vscode from 'vscode';
import { URL } from 'url';
import { EndevorCredential } from '@local/endevor/_doc/Credential';
import {
  EndevorElement,
  EndevorElementLocation,
  EndevorLocation,
} from '@local/endevor/_doc/Endevor';

export interface Parms {
  location: EndevorLocation;
  credential: EndevorCredential;
  endevorElement: EndevorElement;
  localTreeElement: EndevorElementLocation;
}

interface QueryObject {
  protocol: string;
  configuration: string;
  credential: EndevorCredential;
  endevorElement: EndevorElement;
  localTreeElement: EndevorElementLocation;
  pathname: string;
  host: string;
}

export const toVirtualDocUri = (URI_SCHEME: string) => ({
  location: { baseUrl, configuration },
  credential,
  endevorElement,
  localTreeElement,
}: Parms): vscode.Uri => {
  const { host, protocol, pathname } = new URL(baseUrl);
  const queryObject: QueryObject = {
    protocol,
    configuration,
    credential,
    endevorElement,
    localTreeElement,
    pathname,
    host,
  };

  return vscode.Uri.parse('').with({
    scheme: `${URI_SCHEME}`,
    // `path` is used to show nice file label in text editor
    path: `/${endevorElement.elmName}.${endevorElement.typeName.toLowerCase()}`,
    query: JSON.stringify(queryObject),
  });
};

export const fromVirtualDocUri = (uri: vscode.Uri): Parms => {
  const {
    protocol,
    configuration,
    credential,
    endevorElement,
    localTreeElement,
    pathname,
    host,
  }: QueryObject = JSON.parse(uri.query);

  return {
    location: {
      baseUrl: `${protocol}//${host}${pathname}`,
      configuration,
    },
    credential,
    endevorElement,
    localTreeElement,
  };
};
