import { SessConstants } from '@zowe/imperative';

export enum CredentialType {
  BASE = 'base-credential',
  TOKEN = 'token-credential',
}

export interface BaseCredential {
  type: CredentialType.BASE;
  readonly user: string;
  readonly password: string;
}

export interface TokenCredential {
  type: CredentialType.TOKEN;
  readonly tokenType: SessConstants.TOKEN_TYPE_CHOICES;
  readonly tokenValue: string;
}

export type EndevorCredential = BaseCredential | TokenCredential;
