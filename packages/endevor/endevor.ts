import {
  toVersion2Api,
  fromBaseUrl,
  fromStageNumber,
  isDefined,
} from './utils';

import {
  AddUpdElement,
  EndevorClient,
} from '@broadcom/endevor-for-zowe-cli/lib/api';
import {
  ElementQuery,
  ElementWithDependencies,
  ElementWithFingerprint,
  EndevorElement,
  EndevorElementLocation,
  EndevorLocation,
  EndevorService,
  EndevorUrl,
  UpdateParams,
  UploadElementLocation,
} from './_doc/Endevor';
import {
  Session,
  SessConstants,
  ISession as ClientConfig,
} from '@zowe/imperative';
import { EndevorCredential, CredentialType } from './_doc/Credential';
import { UnreachableCaseError } from './typeHelpers';
import { parseToType } from '@local/type-parser/parser';
import {
  DependentElement,
  EndevorElements,
  EndevorRepositories,
} from './_ext/Endevor';
import { Logger } from '@local/extension/_doc/Logger';
import * as fs from 'fs';

export const getInstanceNames = (logger: Logger) => async (
  baseEndevorUrl: EndevorUrl
): Promise<ReadonlyArray<string>> => {
  let responseBody;
  try {
    const session = createEndevorClient(baseEndevorUrl);
    const response = await EndevorClient.listInstances(session);
    if (response.body.returnCode) {
      logger.error(
        'Unable to show actual instances',
        `List repositories got response code: ${response.body.returnCode} with reason: ${response.body.reasonCode}`
      );
      return [];
    }
    responseBody = response.body.data;
  } catch (error) {
    logger.error(
      `Unable to show actual instances', 'List repositories error details: ${error}`
    );
    return [];
  }
  try {
    return parseToType(EndevorRepositories, responseBody).map(
      (repo) => repo.name
    );
  } catch (error) {
    logger.error(
      'Unable to show actual instances',
      `Invalid data format for repositories from Endevor, actual response body: ${JSON.stringify(
        responseBody
      )}`
    );
    return [];
  }
};

const createEndevorClient = ({
  hostname,
  port,
  protocol,
  basePath,
}: EndevorUrl): Session => {
  const clientConfig: ClientConfig = {
    hostname,
    port,
    protocol,
    basePath: toVersion2Api(basePath),
    rejectUnauthorized: false,
  };
  return new Session(clientConfig);
};

const format = (requestParms: unknown, response: unknown) =>
  `Request parms: \n${JSON.stringify(
    requestParms,
    null,
    2
  )} \nResponse: \n${JSON.stringify(response, null, 2)}`;

const listElmForOneSubsys = (logger: Logger) => (session: Session) => async (
  elementLocation: EndevorElementLocation
): Promise<EndevorElement[]> => {
  const anyValue = '*';
  const requestParms = {
    environment: elementLocation.environment || anyValue,
    'stage-number': fromStageNumber(elementLocation.stageNumber),
    system: elementLocation.system || anyValue,
    subsystem: elementLocation.subsystem || anyValue,
    type: elementLocation.type || anyValue,
    element: anyValue,
    data: 'BAS', // get minimal information about an element
    search: true, // search for elements up in endevor `map`
    return: 'FIR', // return only the first occurrence of an element in endevor `map`
  };
  const response = await EndevorClient.listElement(session)(
    elementLocation.instance
  )(requestParms);
  if (response.body.returnCode) {
    // endevor rc>0 is not good
    logger.error(`${response.body.messages.join('\n').trim()}`);
    throw new Error(
      `List element got RC=${response.body.returnCode}\n${format(
        requestParms,
        response
      )}`
    );
  }

  return parseToType(EndevorElements, response.body.data);
};

export const searchForElements = (logger: Logger) => ({
  location,
  credential,
}: EndevorService) => (
  elementLocation: EndevorElementLocation
): Promise<EndevorElement[]> => {
  const sessionConfig = createSecuredEndevorClient(logger)(
    location,
    credential
  );
  return listElmForOneSubsys(logger)(sessionConfig)(elementLocation);
};

export const printElement = (logger: Logger) => async (
  { baseUrl, configuration }: EndevorLocation,
  credential: EndevorCredential,
  { envName, stgNum, sysName, sbsName, typeName, elmName }: ElementQuery
): Promise<string | undefined> => {
  const requestParms = {
    environment: envName,
    'stage-number': stgNum,
    system: sysName,
    subsystem: sbsName,
    type: typeName,
    element: elmName,
  };
  try {
    const session = createSecuredEndevorClient(logger)(
      fromBaseUrl(baseUrl),
      credential
    );
    const response = await EndevorClient.printElement(session)(configuration)(
      requestParms
    );

    if (response.body.returnCode || response.body.data.length == 0) {
      // endevor rc>0 is not good
      logger.error(
        `Unable to view element ${sysName}/${sbsName}/${typeName}/${elmName}`,
        `View element got RC=${response.body.returnCode}\n${format(
          requestParms,
          response
        )}`
      );
      return;
    }
    return response.body.data[0].toString();
  } catch (error) {
    logger.error(
      `Unable to print element ${sysName}/${sbsName}/${typeName}/${elmName}`,
      `Print element error: ${error}`
    );
    return;
  }
};

export const retrieveElementWithFingerprint = (logger: Logger) => async (
  { baseUrl, configuration }: EndevorLocation,
  credential: EndevorCredential,
  { envName, stgNum, sysName, sbsName, typeName, elmName }: ElementQuery
): Promise<ElementWithFingerprint | undefined> => {
  const requestParms = {
    environment: envName,
    'stage-number': stgNum,
    system: sysName,
    subsystem: sbsName,
    type: typeName,
    element: elmName,
    signout: false,
  };
  try {
    const session = createSecuredEndevorClient(logger)(
      fromBaseUrl(baseUrl),
      credential
    );
    const response = await EndevorClient.retrieveElement(session)(
      configuration
    )(requestParms);

    if (response.body.returnCode || response.body.data.length == 0) {
      // endevor rc>0 is not good
      logger.error(
        `Unable to retrieve element ${sysName}/${sbsName}/${typeName}/${elmName}`,
        `Retrieve element got RC=${response.body.returnCode}\n${format(
          requestParms,
          response
        )}`
      );
      return;
    }
    if (!response.headers.fingerprint) {
      logger.error(
        `Unable to retrieve element ${sysName}/${sbsName}/${typeName}/${elmName}`,
        `No fingerprint returned for element. Actual response:\n${format(
          requestParms,
          response
        )}`
      );
      return undefined;
    }
    return {
      element: response.body.data[0].toString(),
      fingerprint: response.headers.fingerprint.toString(),
    };
  } catch (error) {
    logger.error(
      `Unable to retrieve element ${sysName}/${sbsName}/${typeName}/${elmName}`,
      `Retrieve element error: ${error}`
    );
    return;
  }
};

export const retrieveElement = (logger: Logger) => async (
  endevorLocation: EndevorLocation,
  credential: EndevorCredential,
  elementLocation: ElementQuery
): Promise<string | undefined> => {
  const elementContent = await retrieveElementWithFingerprint(logger)(
    endevorLocation,
    credential,
    elementLocation
  );
  if (!elementContent) {
    return undefined;
  }
  return elementContent.element;
};

export const retrieveElementWithDependencies = (logger: Logger) => async (
  endevorLocation: EndevorLocation,
  credential: EndevorCredential,
  elementLocation: EndevorElement
): Promise<ElementWithDependencies | undefined> => {
  const element = await retrieveElement(logger)(
    endevorLocation,
    credential,
    elementLocation
  );
  if (!element) {
    return undefined;
  }
  const dependencies = await retrieveElementDependencies(logger)(
    endevorLocation,
    credential,
    elementLocation
  );
  return {
    element,
    dependencies,
  };
};

const retrieveElementDependencies = (logger: Logger) => async (
  location: EndevorLocation,
  credential: EndevorCredential,
  query: ElementQuery
): Promise<ReadonlyArray<[DependentElement, string | undefined]>> => {
  const dependentElements = await retrieveDependentElements(logger)(
    location,
    credential,
    query
  );
  // we need to be careful with a lot of dependencies
  const contents = await Promise.all(
    dependentElements
      .filter((dependency) => dependency.elmName.trim()) // endevor can return name with space inside
      .map((dependency) =>
        retrieveElement(logger)(location, credential, dependency)
      )
  );
  return dependentElements.map((element, index) => {
    return [element, contents[index]];
  });
};

const retrieveDependentElements = (logger: Logger) => async (
  { baseUrl, configuration }: EndevorLocation,
  credential: EndevorCredential,
  { envName, stgNum, sysName, sbsName, typeName, elmName }: ElementQuery
): Promise<ReadonlyArray<DependentElement>> => {
  const requestParms = {
    environment: envName,
    'stage-number': stgNum,
    system: sysName,
    subsystem: sbsName,
    type: typeName,
    element: elmName,
    excCirculars: 'yes',
    excIndirect: 'no',
    excRelated: 'no',
  };
  try {
    const session = createSecuredEndevorClient(logger)(
      fromBaseUrl(baseUrl),
      credential
    );
    const response = await EndevorClient.queryAcmComponent(session)(
      configuration
    )(requestParms);
    if (response.body.returnCode || response.body.data.length == 0) {
      // endevor rc>0 is not good
      logger.warn(
        `Unable to retrieve element ${sysName}/${sbsName}/${typeName}/${elmName} dependencies`,
        `Retrieve element dependencies got RC=${
          response.body.returnCode
        }\n${format(requestParms, response)}`
      );
      return [];
    }
    const elementWithComponents = response.body.data[0];

    return elementWithComponents.components
      .map((element: DependentElement) => {
        try {
          return parseToType(DependentElement, element);
        } catch (error) {
          return undefined;
        }
      })
      .filter(isDefined);
  } catch (error) {
    logger.error(
      `Unable to retrieve element ${sysName}/${sbsName}/${typeName}/${elmName} dependencies`,
      `Retrieve element dependencies error: ${error}`
    );
    return [];
  }
};

export const viewElement = retrieveElement;

/**
 * list env to make sure connection and credential is valid
 */
export const validateCredential = (logger: Logger) => async (
  { baseUrl, configuration }: EndevorLocation,
  credential: EndevorCredential
): Promise<boolean> => {
  const requestParms = {
    environment: '*',
  };
  const session = createSecuredEndevorClient(logger)(
    fromBaseUrl(baseUrl),
    credential
  );
  try {
    const response = await EndevorClient.listEnvironment(session)(
      configuration
    )(requestParms);
    if (
      response.body.returnCode &&
      response.body.messages &&
      response.body.messages.join('').includes('API0034S')
    ) {
      // endevor rc>0 is not good
      logger.error(
        `Unable to authorize with ${session.ISession.hostname}:${session.ISession.port}. Invalid credential detected.`,
        `Authorization got RC=${response.body.returnCode}\n${format(
          requestParms,
          response
        )}`
      );
      return false;
    }
    return true;
  } catch (error) {
    logger.error(
      `Unable to authorize with ${session.ISession.hostname}:${session.ISession.port}: ${error}`,
      `Authorization error: ${error}`
    );
    return false;
  }
};

const createSecuredEndevorClient = (logger: Logger) => (
  baseUrl: EndevorUrl,
  credential: EndevorCredential
): Session => {
  logger.trace('Creating an endevor session and cfg.');
  const commonConfig: ClientConfig = createEndevorClient(baseUrl).ISession;
  let securedConfig: ClientConfig;
  switch (credential.type) {
    case CredentialType.TOKEN:
      logger.trace('Using token authentication.');
      securedConfig = {
        ...commonConfig,
        type: SessConstants.AUTH_TYPE_TOKEN,
        tokenType: credential.tokenType,
        tokenValue: credential.tokenValue,
      };
      break;
    case CredentialType.BASE:
      logger.trace('Using basic authentication.');
      securedConfig = {
        ...commonConfig,
        type: SessConstants.AUTH_TYPE_BASIC,
        user: credential.user,
        password: credential.password,
      };
      break;
    default:
      throw new UnreachableCaseError(credential);
  }
  const session = new Session(securedConfig);
  logger.trace(
    `Setup endevor session: \n${JSON.stringify(
      session.ISession,
      (key, value) => {
        // mask sensitive information
        return key === 'password' || key === 'base64EncodedAuth'
          ? '*****'
          : value;
      },
      2
    )}`
  );
  return session;
};

export const updateElement = (logger: Logger) => (
  { baseUrl, configuration }: EndevorLocation,
  credential: EndevorCredential,
  {
    envName,
    stgNum,
    sysName,
    sbsName,
    typeName,
    elmName,
  }: UploadElementLocation
) => async ({
  fingerprint,
  content,
  ccid,
  comment,
}: UpdateParams): Promise<void | Error> => {
  const elementData = {
    element: elmName,
    environment: envName,
    stageNumber: stgNum,
    system: sysName,
    subsystem: sbsName,
    type: typeName,
  };
  try {
    const session = createSecuredEndevorClient(logger)(
      fromBaseUrl(baseUrl),
      credential
    );
    const requestParms = await setupUpdateRequest({
      ccid,
      comment,
      fingerprint,
      content,
    });
    const response = await AddUpdElement.updElement(
      session,
      configuration,
      elementData,
      requestParms
    );

    if (response.body.returnCode) {
      // endevor rc>0 is not good
      logger.trace(`${response.body.messages.join('\n').trim()}`);
      return new Error(
        `Update element got RC=${response.body.returnCode}\n${format(
          requestParms,
          response
        )}`
      );
    }
  } catch (error) {
    logger.trace(
      `Element ${sysName}/${sbsName}/${typeName}/${elmName} cannot be uploaded because of: ${error}.`
    );
    return new Error(
      `Element ${sysName}/${sbsName}/${typeName}/${elmName} cannot be uploaded.`
    );
  }
};

type UpdateElementParams = Readonly<{
  fingerprint: string;
  fromFile: fs.ReadStream;
  ccid?: string;
  comment?: string;
}>;

export const setupUpdateRequest = async ({
  fingerprint,
  content,
  ccid,
  comment,
}: UpdateParams): Promise<UpdateElementParams | Error> => {
  let sourceFile;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const string2fileStream = require('string-to-file-stream');
    sourceFile = string2fileStream(content);
  } catch (err) {
    return new Error(`Reading element source file error: ${err}`);
  }
  return {
    fromFile: sourceFile,
    ccid,
    comment,
    fingerprint,
  };
};
