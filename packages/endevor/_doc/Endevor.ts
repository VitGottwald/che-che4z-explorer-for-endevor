import { EndevorCredential } from './Credential';

export type ElementQuery = Readonly<{
  envName: string;
  stgNum: string;
  sysName: string;
  sbsName: string;
  typeName: string;
  elmName: string;
}>;
export type UploadElementLocation = ElementQuery;

export interface EndevorElement {
  envName: string;
  stgNum: string;
  sysName: string;
  sbsName: string;
  typeName: string;
  elmName: string;
  fileExt: string;
}

export interface DependentElement {
  envName: string;
  stgNum: string;
  sysName: string;
  sbsName: string;
  typeName: string;
  elmName: string;
}

export type ElementWithDependencies = Readonly<{
  element: string;
  dependencies: ReadonlyArray<[DependentElement, string | undefined]>;
}>;

export type ElementWithFingerprint = Readonly<{
  element: string;
  fingerprint: string;
}>;

export interface EndevorResponseData {
  returnCode: number;
  reasonCode: number;
  reports: Record<string, unknown>;
  data: Array<unknown>;
  messages: string[];
}

export interface EndevorLocation {
  baseUrl: string;
  configuration: string;
}

export type EndevorStageNumber = '1' | '2';

export type EndevorElementLocation = Readonly<
  { instance: string } & Partial<{
    environment: string;
    stageNumber: EndevorStageNumber;
    system: string;
    subsystem: string;
    type: string;
    ccid: string;
    comment: string;
  }>
>;

export type EndevorServiceProtocol = 'http' | 'https';

export type EndevorUrl = Readonly<{
  protocol: EndevorServiceProtocol;
  port: number;
  hostname: string;
  basePath: string;
}>;

export type EndevorService = Readonly<{
  location: EndevorUrl;
  credential: EndevorCredential;
  rejectUnauthorized: boolean;
}>;

export type UpdateParams = Readonly<{
  fingerprint: string;
  content: string;
  ccid: string;
  comment: string;
}>;
