import * as endevor from '../endevor';
import { getLocal } from 'mockttp';
import {
  BaseCredential,
  CredentialType,
  EndevorCredential,
} from '../_doc/Credential';
import { MockRequest, MockResponse } from '../_doc/MockServer';
import {
  DependentElement,
  EndevorElement,
  EndevorResponseData,
} from '../_doc/Endevor';
import { mockEndpoint } from '../testUtils';
import { IEndevorRestResponseBody } from '@broadcom/endevor-for-zowe-cli/lib/api';
import { URL } from 'url';
import { toEndevorProtocol } from '../utils';

jest.mock('@zowe/imperative/lib/console/src/Console'); // disable imperative logging

const logger = {
  trace: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const warnSpy = logger.warn;
afterEach(() => warnSpy.mockClear());

const mockServer = getLocal();
beforeEach(() => mockServer.start());
afterEach(() => mockServer.stop());

const basePath = '/EndevorService/api/v2';
const instance = 'STC';
const credential: EndevorCredential = {
  type: CredentialType.BASE,
  user: 'user',
  password: 'pass',
};

// utility functions
const requestPath = (
  element: {
    envName: string;
    stgNum: string;
    sysName: string;
    sbsName: string;
    typeName: string;
    elmName: string;
  },
  basePath: string,
  instance: string
): string => {
  return `${basePath}/${instance}/env/${element.envName}/stgnum/${element.stgNum}/sys/${element.sysName}/subsys/${element.sbsName}/type/${element.typeName}/ele/${element.elmName}`;
};

const basicAuthHeader = ({ user, password }: BaseCredential): string => {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
};

describe('validateCredential using (list env) endevor call,', () => {
  it('when response rc = 0, should log info from SDK and return true', async () => {
    // Arrange
    // - mock list env with valid credential endpoint
    const request: MockRequest<null> = {
      method: 'GET',
      path: `${basePath}/${instance}/env/*`,
      headers: {
        Accept: 'application/json',
        Authorization: basicAuthHeader(credential),
      },
      body: null,
    };
    const response: MockResponse<EndevorResponseData> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        version: '2.1',
        'content-type': 'application/json',
      },
      data: {
        returnCode: 0,
        reasonCode: 0,
        reports: {},
        data: [],
        messages: [],
      },
    };
    const endpoint = await mockEndpoint(request, response)(mockServer);

    // Act
    const isCredValid = await endevor.validateCredential(logger)(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential
    );

    // Assert
    const seenRequests = await endpoint.getSeenRequests();
    expect(seenRequests.length).toBe(1);
    seenRequests.forEach((request) =>
      expect(request.body.json).toBeUndefined()
    );

    expect(isCredValid).toEqual(true);
  });

  it('when response rc > 0 and contains API0034S, should log info from SDK, error details, and return false', async () => {
    // Arrange
    const request: MockRequest<undefined> = {
      method: 'GET',
      path: `${basePath}/${instance}/env/*`,
      headers: {
        Accept: 'application/json',
        Authorization: basicAuthHeader(credential),
      },
      body: undefined,
    };
    const response: MockResponse<EndevorResponseData> = {
      status: 400,
      statusMessage: 'Bad Request',
      headers: {
        version: '2.1',
        'content-type': 'application/json',
      },
      data: {
        returnCode: 12,
        reasonCode: 0,
        reports: {},
        data: [],
        messages: ['API0034S INVALID USERID OR PASSWORD DETECTED'],
      },
    };
    const endpoint = await mockEndpoint(request, response)(mockServer);

    // Act
    const isCredValid = await endevor.validateCredential(logger)(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential
    );

    // Assert
    const seenRequests = await endpoint.getSeenRequests();
    expect(seenRequests.length).toBe(1);

    expect(isCredValid).toEqual(false);
  });

  it('when response rc > 0 but not contain API0034S, should log info from SDK, and return true', async () => {
    // Arrange
    const request: MockRequest<undefined> = {
      method: 'GET',
      path: `${basePath}/${instance}/env/*`,
      headers: {
        Accept: 'application/json',
        Authorization: basicAuthHeader(credential),
      },
      body: undefined,
    };
    const response: MockResponse<EndevorResponseData> = {
      status: 400,
      statusMessage: 'Bad Request',
      headers: {
        version: '2.1',
        'content-type': 'application/json',
      },
      data: {
        returnCode: 12,
        reasonCode: 0,
        reports: {},
        data: [],
        messages: ['some other error'],
      },
    };
    const endpoint = await mockEndpoint(request, response)(mockServer);

    // Act
    const isCredValid = await endevor.validateCredential(logger)(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential
    );

    // Assert
    const seenRequests = await endpoint.getSeenRequests();
    expect(seenRequests.length).toBe(1);

    expect(isCredValid).toEqual(true);
  });

  it('when connection refused from server, should log info from SDK, error details, and return false', async () => {
    // Arrange

    // Act
    const isCredValid = await endevor.validateCredential(logger)(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential
    );

    // Assert
    expect(isCredValid).toEqual(false);
  });
});

describe('retrieveElementWithFingerprint', () => {
  // constants
  const element: EndevorElement = {
    envName: 'DEV',
    stgNum: '1',
    sysName: 'SYS',
    sbsName: 'SUB',
    typeName: 'ASMMAC',
    elmName: 'MACRO',
    fileExt: 'cbl',
  };
  const credential: EndevorCredential = {
    type: CredentialType.BASE,
    user: 'user',
    password: 'pass',
  };

  it('should return element content when rc = 0', async () => {
    // Arrange
    const request: MockRequest<null> = {
      method: 'GET',
      path: requestPath(element, basePath, instance),
      headers: {
        Accept: 'application/octet-stream',
        Authorization: basicAuthHeader(credential),
      },
      query: '?signout=no',
      body: null,
    };
    const elementContent = 'element content\n';
    const response: MockResponse<string> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        'content-disposition': `attachment; filename="${element.elmName}.${element.typeName}"`,
        fingerprint:
          '01343CB60041A35001343CB60041A35001343CB60041A35001343CB60041A35001343CB60041A35001343CB60041A35001343CB60041A3500133C58E003DAC38',
        link: '</reports/1594641152-038405589-APIMSGS>; rel="APIMSGS"',
        version: '2.1',
        'content-type': 'application/octet-stream',
        'content-length': elementContent.length.toString(),
      },
      data: elementContent,
    };
    const endpoint = await mockEndpoint(request, response)(mockServer);

    // Act
    const retrievedElement = await endevor.retrieveElementWithFingerprint(
      logger
    )(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential,
      element
    );

    // Assert
    const seenRequests = await endpoint.getSeenRequests();
    expect(seenRequests.length).toBe(1);

    expect(retrievedElement?.element).toEqual(elementContent);
    expect(retrievedElement?.fingerprint).toEqual(response.headers.fingerprint);
  });

  it('should return undefined when response has no fingerprint', async () => {
    // Arrange
    const request: MockRequest<null> = {
      method: 'GET',
      path: requestPath(element, basePath, instance),
      headers: {
        Accept: 'application/octet-stream',
        Authorization: basicAuthHeader(credential),
      },
      query: '?signout=no',
      body: null,
    };
    const elementContent = 'element content\n';
    const response: MockResponse<string> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        'content-disposition': `attachment; filename="${element.elmName}.${element.typeName}"`,
        link: '</reports/1594641152-038405589-APIMSGS>; rel="APIMSGS"',
        version: '2.1',
        'content-type': 'application/octet-stream',
        'content-length': elementContent.length.toString(),
      },
      data: elementContent,
    };
    const endpoint = await mockEndpoint(request, response)(mockServer);

    // Act
    const retrievedElement = await endevor.retrieveElementWithFingerprint(
      logger
    )(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential,
      element
    );

    // Assert
    const seenRequests = await endpoint.getSeenRequests();
    expect(seenRequests.length).toBe(1);

    expect(retrievedElement).toBeUndefined();
  });

  it('should return undefined when rc > 0', async () => {
    // Arrange
    const request: MockRequest<null> = {
      method: 'GET',
      path: requestPath(element, basePath, instance),
      headers: {
        Accept: 'application/octet-stream',
        Authorization: basicAuthHeader(credential),
      },
      query: '?signout=no',
      body: null,
    };
    const responseBody: Readonly<IEndevorRestResponseBody> = {
      returnCode: 4,
      reasonCode: 4,
      reports: {
        APIMSGS: '/reports/1594651574-449327773-APIMSGS',
        C1MSGS1: '/reports/1594651574-449327773-C1MSGS1',
        C1MSGSA: '/reports/1594651574-449327773-C1MSGSA',
      },
      data: [],
      messages: [
        'EWS1117I Request processed by SysID A31SENF, STC CMEWXYTS - STC40477',
        '10:46:15  API0000W  WARNING(S) DETECTED, PROCESSING COMPLETE',
        '10:46:14  IMGR007W  NO SUBSYSTEMS MATCH NOTFOUND IN SYSTEM',
      ],
    };
    const response: MockResponse<IEndevorRestResponseBody> = {
      status: 400,
      statusMessage: 'Bad Request',
      headers: {
        version: '2.1',
        'content-type': 'application/json',
        'content-length': JSON.stringify(responseBody).length.toString(),
      },
      data: responseBody,
    };
    const endpoint = await mockEndpoint(request, response)(mockServer);

    // Act
    const retrievedElement = await endevor.retrieveElementWithFingerprint(
      logger
    )(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential,
      element
    );

    // Assert
    const seenRequests = await endpoint.getSeenRequests();
    expect(seenRequests.length).toBe(1);

    expect(retrievedElement).toBeUndefined();
  });

  it('should return undefined when connection refused', async () => {
    // Arrange

    // Act
    const retrievedElement = await endevor.retrieveElementWithFingerprint(
      logger
    )(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential,
      element
    );

    // Assert
    expect(retrievedElement).toBeUndefined();
  });
});

describe('retrieveWithDependencies', () => {
  // element itself
  const element: EndevorElement = {
    envName: 'SMPLPROD',
    stgNum: '1',
    sysName: 'FINANCE',
    sbsName: 'ACCTREC',
    typeName: 'COBOL',
    elmName: 'TEST',
    fileExt: 'cbl',
  };
  const elementContent = 'main content\n';
  const retrieveElementRequest: MockRequest<null> = {
    method: 'GET',
    path: requestPath(element, basePath, instance),
    headers: {
      Accept: 'application/octet-stream',
      Authorization: basicAuthHeader(credential),
    },
    query: '?signout=no',
    body: null,
  };
  const dependenciesListRequest: MockRequest<null> = {
    method: 'GET',
    path: `${requestPath(element, basePath, instance)}/acm`,
    headers: {
      Accept: 'application/json',
      Authorization: basicAuthHeader(credential),
    },
    // TODO: for now, Endevor SDK ignores our parameters and use `yes` in every param, need to be investigated
    query: '?excCirculars=yes&excIndirect=yes&excRelated=yes',
    body: null,
  };
  const firstDependency: DependentElement = {
    envName: 'SMPLPROD',
    stgNum: '1',
    sysName: 'FINANCE',
    sbsName: 'ACCTREC',
    typeName: 'COPY',
    elmName: 'TESTCOP1',
  };
  const firstDependencyContent = 'first dependency content\n';
  const retrieveFirstDependencyRequest: MockRequest<null> = {
    method: 'GET',
    path: requestPath(firstDependency, basePath, instance),
    headers: {
      Accept: 'application/octet-stream',
      Authorization: basicAuthHeader(credential),
    },
    query: '?signout=no',
    body: null,
  };
  const secondDependency: DependentElement = {
    envName: 'SMPLPROD',
    stgNum: '1',
    sysName: 'FINANCE',
    sbsName: 'ACCTREC',
    typeName: 'COPY',
    elmName: 'TESTCOP2',
  };
  // const secondDependencyContent = 'second dependency content\n';
  const retrieveSecondDependencyRequest: MockRequest<null> = {
    method: 'GET',
    path: requestPath(secondDependency, basePath, instance),
    headers: {
      Accept: 'application/octet-stream',
      Authorization: basicAuthHeader(credential),
    },
    query: '?signout=no',
    body: null,
  };

  it('should return element without failed dependencies', async () => {
    // arrange
    const retrieveElementSuccessResponse: MockResponse<string> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        fingerprint: 'some_value',
        version: '2.1',
        'content-type': 'application/octet-stream',
      },
      data: elementContent,
    };
    const retrieveElementEndpoint = await mockEndpoint(
      retrieveElementRequest,
      retrieveElementSuccessResponse
    )(mockServer);

    const dependenciesListSuccessResponse: MockResponse<IEndevorRestResponseBody> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        version: '2.1',
        'content-type': 'application/json',
      },
      data: {
        returnCode: 0,
        reasonCode: 0,
        reports: {},
        data: [
          {
            ...element,
            components: [firstDependency, secondDependency],
          },
        ],
        messages: [],
      },
    };
    const dependenciesListEndpoint = await mockEndpoint(
      dependenciesListRequest,
      dependenciesListSuccessResponse
    )(mockServer);

    const retrieveFirstDependencySuccessResponse: MockResponse<string> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        fingerprint: 'some_value',
        version: '2.1',
        'content-type': 'application/octet-stream',
      },
      data: firstDependencyContent,
    };
    const firstDependencyRetrieveEndpoint = await mockEndpoint(
      retrieveFirstDependencyRequest,
      retrieveFirstDependencySuccessResponse
    )(mockServer);

    const retrieveSecondDependencyErrorResponse: MockResponse<IEndevorRestResponseBody> = {
      status: 400,
      statusMessage: 'Bad Request',
      headers: {
        version: '2.1',
      },
      data: {
        returnCode: 8,
        reasonCode: 8,
        reports: {},
        data: [],
        messages: ['something went wrong'],
      },
    };
    const secondDependencyRetrieveEndpoint = await mockEndpoint(
      retrieveSecondDependencyRequest,
      retrieveSecondDependencyErrorResponse
    )(mockServer);
    // act
    const elementWithDeps = await endevor.retrieveElementWithDependencies(
      logger
    )(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential,
      element
    );
    // assert
    const elementRetrieveRequests = await retrieveElementEndpoint.getSeenRequests();
    expect(elementRetrieveRequests.length).toBe(1);
    const dependenciesListRequests = await dependenciesListEndpoint.getSeenRequests();
    expect(dependenciesListRequests.length).toBe(1);
    const firstDependencyRetrieveRequests = await firstDependencyRetrieveEndpoint.getSeenRequests();
    expect(firstDependencyRetrieveRequests.length).toBe(1);
    const secondDependencyRetrieveRequests = await secondDependencyRetrieveEndpoint.getSeenRequests();
    expect(secondDependencyRetrieveRequests.length).toBe(1);

    expect(elementWithDeps).toBeDefined();
    expect(elementWithDeps?.element).toEqual(elementContent);

    const secondDependencyEmptyContent = undefined;
    expect(elementWithDeps?.dependencies).toEqual([
      [firstDependency, firstDependencyContent],
      [secondDependency, secondDependencyEmptyContent],
    ]);
  });
  it('should return element with empty dependencies without correct dependencies list response', async () => {
    // arrange
    const retrieveElementSuccessResponse: MockResponse<string> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        fingerprint: 'some_value',
        version: '2.1',
        'content-type': 'application/octet-stream',
      },
      data: elementContent,
    };
    const elementRetrieveEndpoint = await mockEndpoint(
      retrieveElementRequest,
      retrieveElementSuccessResponse
    )(mockServer);

    const dependenciesListIncorrectResponse: MockResponse<IEndevorRestResponseBody> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        version: '2.1',
        'content-type': 'application/json',
      },
      data: {
        returnCode: 0,
        reasonCode: 0,
        reports: {},
        data: [
          {
            ...element,
            // components list should be provided in the response
            // components: [firstDependency, secondDependency],
          },
        ],
        messages: [],
      },
    };
    const dependenciesListEndpoint = await mockEndpoint(
      dependenciesListRequest,
      dependenciesListIncorrectResponse
    )(mockServer);
    // act
    const elementWithDeps = await endevor.retrieveElementWithDependencies(
      logger
    )(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential,
      element
    );
    // assert
    const elementRetrieveRequests = await elementRetrieveEndpoint.getSeenRequests();
    expect(elementRetrieveRequests.length).toBe(1);
    const dependenciesListRequests = await dependenciesListEndpoint.getSeenRequests();
    expect(dependenciesListRequests.length).toBe(1);

    expect(elementWithDeps).toBeDefined();
    expect(elementWithDeps?.element).toEqual(elementContent);

    expect(elementWithDeps?.dependencies).toEqual([]);
  });
  it('should return undefined, if element itself was not retrieved correctly', async () => {
    // arrange
    // we don't declare any mock server response, so the response will be: connection refused
    // act
    const elementWithDeps = await endevor.retrieveElementWithDependencies(
      logger
    )(
      {
        baseUrl: mockServer.urlFor(basePath),
        configuration: instance,
      },
      credential,
      element
    );
    // assert
    expect(elementWithDeps).toBeUndefined();
  });
});

describe('getIntanceNames', () => {
  type EndevorRepository = {
    description: string;
    message: string;
    name: string;
    status: string;
    jobName: string;
    programName: string;
    hostName: string;
    comments: string;
    userId: string;
    password: null;
    poolInitSize: number;
    poolIncrSize: number;
    poolMaxSize: number;
    poolReapTime: number;
    unusedTimeout: number;
    agedTimeout: number;
    lang: string;
    timeZone: string;
    characterSet: string;
    codepage: string;
    contentType: string;
    traced: string;
  };
  const getRepositoriesRequest: MockRequest<null> = {
    method: 'GET',
    path: basePath + '/',
    headers: {},
    body: null,
  };
  it('should return list of instance names', async () => {
    // arrange
    const expectedInstanceNames = ['WEBSMFNO', 'WEBSMFAM'];
    const responseBody: ReadonlyArray<EndevorRepository> = expectedInstanceNames.map(
      (name) => {
        return {
          description: 'Endevor Web Services',
          message: 'ENDEVOR Web Service',
          name,
          status: 'Available',
          jobName: 'TSO1',
          programName: 'BC1PAPI0',
          hostName: 'A01SENF',
          comments: 'Welcome to ENDEVOR Region',
          userId: 'ENDEVOR',
          password: null,
          poolInitSize: 2,
          poolIncrSize: 1,
          poolMaxSize: 8,
          poolReapTime: 180,
          unusedTimeout: 0,
          agedTimeout: 3600,
          lang: 'EN',
          timeZone: 'GMT-6.0',
          characterSet: 'ISO8859-1',
          codepage: 'cp1047',
          contentType: 'Text',
          traced: 'ALL',
        };
      }
    );
    const repositoriesResponse: MockResponse<ReadonlyArray<
      EndevorRepository
    >> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        version: '2.1',
        'content-type': 'application/json',
      },
      data: responseBody,
    };
    const endevorEndpoint = await mockEndpoint(
      getRepositoriesRequest,
      repositoriesResponse
    )(mockServer);
    // act
    const mockServerBaseUrl = mockServer.urlFor(basePath);
    const { protocol, hostname, port, pathname } = new URL(mockServerBaseUrl);
    const actualInstanceNames = await endevor.getInstanceNames(logger)({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      protocol: toEndevorProtocol(protocol)!,
      hostname,
      basePath: pathname,
      port: parseInt(port, 10),
    });
    // assert
    const seenRequests = await endevorEndpoint.getSeenRequests();
    const calledOnce = seenRequests.length === 1;
    expect(calledOnce).toBe(true);

    expect(actualInstanceNames).toEqual(expectedInstanceNames);
  });
  it('should return empty instance names for invalid response format', async () => {
    // arrange
    const wrongFormattedResponseBody = [
      {
        description: 'Endevor Web Services',
        // name: 'some_name',
        message: 'ENDEVOR Web Service',
        status: 'Available',
        jobName: 'TSO1',
        programName: 'BC1PAPI0',
        hostName: 'A01SENF',
        comments: 'Welcome to ENDEVOR Region',
        userId: 'ENDEVOR',
        password: null,
        poolInitSize: 2,
        poolIncrSize: 1,
        poolMaxSize: 8,
        poolReapTime: 180,
        unusedTimeout: 0,
        agedTimeout: 3600,
        lang: 'EN',
        timeZone: 'GMT-6.0',
        characterSet: 'ISO8859-1',
        codepage: 'cp1047',
        contentType: 'Text',
        traced: 'ALL',
      },
    ];
    const response: MockResponse<unknown> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        version: '2.1',
        'content-type': 'application/json',
      },
      data: wrongFormattedResponseBody,
    };
    const endevorEndpoint = await mockEndpoint(
      getRepositoriesRequest,
      response
    )(mockServer);
    // act
    const mockServerBaseUrl = mockServer.urlFor(basePath);
    const { protocol, hostname, port, pathname } = new URL(mockServerBaseUrl);
    const actualInstanceNames = await endevor.getInstanceNames(logger)({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      protocol: toEndevorProtocol(protocol)!,
      hostname,
      basePath: pathname,
      port: parseInt(port, 10),
    });
    // assert
    const seenRequests = await endevorEndpoint.getSeenRequests();
    const calledOnce = seenRequests.length === 1;
    expect(calledOnce).toBe(true);

    expect(actualInstanceNames).toEqual([]);
  });
  it('should return empty instance names for broken connection', async () => {
    // arrange
    // no endpoint is ready to handle request
    // act
    const mockServerBaseUrl = mockServer.urlFor(basePath);
    const { protocol, hostname, port, pathname } = new URL(mockServerBaseUrl);
    const actualInstanceNames = await endevor.getInstanceNames(logger)({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      protocol: toEndevorProtocol(protocol)!,
      hostname,
      basePath: pathname,
      port: parseInt(port, 10),
    });
    // assert
    expect(actualInstanceNames).toEqual([]);
  });
});
