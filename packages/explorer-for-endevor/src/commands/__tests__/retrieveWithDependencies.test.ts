import * as vscode from 'vscode';
import { BaseCredential, CredentialType } from '@local/endevor/_doc/Credential';
import {
  DependentElement,
  EndevorElement,
  EndevorElementLocation,
  EndevorResponseData,
} from '@local/endevor/_doc/Endevor';
import { MockRequest, MockResponse } from '@local/endevor/_doc/MockServer';
import { Extension } from '@local/extension/_doc/Extension';
import { getLocal } from 'mockttp';
import * as path from 'path';
import { getExtension } from '../../vscodeTestUtils';
import { mockEndpoint } from '@local/endevor/testUtils';
import { URI_SCHEME } from '../../constants';
import { CommandId } from '../id';
import { assert, expect } from 'chai';
import * as fs from 'fs';
import { TextEncoder } from 'util';
import { isError } from '../../utils';
import { toVirtualDocUri } from '../../uri';

// utility functions
const basicAuthHeader = ({ user, password }: BaseCredential): string => {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
};

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

const safeUnlink = async (filePath: string): Promise<void | Error> => {
  try {
    return await fs.promises.unlink(filePath);
  } catch (e) {
    return e;
  }
};

const checkExistence = async (filePath: string): Promise<boolean> => {
  try {
    await fs.promises.stat(filePath);
    return true;
  } catch (e) {
    return false;
  }
};

const safeReadFile = async (filePath: string): Promise<Buffer | Error> => {
  try {
    return fs.promises.readFile(filePath);
  } catch (e) {
    return e;
  }
};

describe('retrieving element with dependencies', () => {
  const endevorElement: EndevorElement = {
    envName: 'SMPLPROD',
    stgNum: '1',
    sysName: 'FINANCE',
    sbsName: 'ACCTREC',
    typeName: 'COBOL',
    elmName: 'TESTCOB',
    fileExt: 'cbl',
  };
  const localTreeElement: EndevorElementLocation = {
    instance: 'WEBMFTST',
    environment: 'SMPLPROD',
    stageNumber: '1',
    system: 'FINANCE',
    subsystem: 'ACCTREC',
    type: 'COBOL',
    ccid: 'TEST',
    comment: 'testComment',
  };
  const elementContent = 'main content\n';
  const firstDependency: DependentElement = {
    envName: 'SMPLPROD',
    stgNum: '1',
    sysName: 'FINANCE',
    sbsName: 'ACCTREC',
    typeName: 'COPY',
    elmName: 'TESTCOP1',
  };
  const firstDependencyContent = 'first dependency content\n';
  const secondDependency: DependentElement = {
    envName: 'SMPLPROD',
    stgNum: '1',
    sysName: 'FINANCE',
    sbsName: 'ACCTREC',
    typeName: 'COPY',
    elmName: 'TESTCOP2',
  };
  const secondDependencyContent = 'second dependency content\n';

  const endevorCredential: BaseCredential = {
    type: CredentialType.BASE,
    user: 'user',
    password: 'pass',
  };

  const testWorkspace = vscode.Uri.file(
    path.join(__dirname, '../../../workspace')
  );
  const retrievedElementPath = `${testWorkspace.fsPath}/${endevorElement.typeName}/${endevorElement.elmName}.${endevorElement.fileExt}`;
  const retrievedFirstDependencyPath = `${testWorkspace.fsPath}/${firstDependency.typeName}/${firstDependency.elmName}`;
  const retrievedSecondDependencyPath = `${testWorkspace.fsPath}/${secondDependency.typeName}/${secondDependency.elmName}`;

  const endevorBasePath = '/EndevorService/api/v2';
  const endevorInstance = 'WEBMFTST';
  const mockServer = getLocal();
  const retrieveElementRequest: MockRequest<null> = {
    method: 'GET',
    path: requestPath(endevorElement, endevorBasePath, endevorInstance),
    headers: {
      Accept: 'application/octet-stream',
      Authorization: basicAuthHeader(endevorCredential),
    },
    query: '?signout=no',
    body: null,
  };
  const dependenciesListRequest: MockRequest<null> = {
    method: 'GET',
    path: `${requestPath(
      endevorElement,
      endevorBasePath,
      endevorInstance
    )}/acm`,
    headers: {
      Accept: 'application/json',
      Authorization: basicAuthHeader(endevorCredential),
    },
    // TODO: for now, Endevor SDK ignores our parameters and use `yes` in every param, need to be investigated
    query: '?excCirculars=yes&excIndirect=yes&excRelated=yes',
    body: null,
  };
  const retrieveFirstDependencyRequest: MockRequest<null> = {
    method: 'GET',
    path: requestPath(firstDependency, endevorBasePath, endevorInstance),
    headers: {
      Accept: 'application/octet-stream',
      Authorization: basicAuthHeader(endevorCredential),
    },
    query: '?signout=no',
    body: null,
  };
  const retrieveSecondDependencyRequest: MockRequest<null> = {
    method: 'GET',
    path: requestPath(secondDependency, endevorBasePath, endevorInstance),
    headers: {
      Accept: 'application/octet-stream',
      Authorization: basicAuthHeader(endevorCredential),
    },
    query: '?signout=no',
    body: null,
  };

  let extension: vscode.Extension<Extension>;

  before(async () => {
    await vscode.commands.executeCommand('vscode.openFolder', testWorkspace);
    extension = getExtension();
    await extension.activate();
  });

  beforeEach(async () => {
    await mockServer.start();
  });

  afterEach(async () => {
    await mockServer.stop();
    await safeUnlink(retrievedElementPath);
    await safeUnlink(retrievedFirstDependencyPath);
    await safeUnlink(retrievedSecondDependencyPath);
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  it('should retrieve element with dependencies from Endevor', async () => {
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

    const dependenciesListSuccessResponse: MockResponse<EndevorResponseData> = {
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
            ...endevorElement,
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

    const retrieveSecondDependencySuccessResponse: MockResponse<string> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        fingerprint: 'some_value',
        version: '2.1',
        'content-type': 'application/octet-stream',
      },
      data: secondDependencyContent,
    };
    const secondDependencyRetrieveEndpoint = await mockEndpoint(
      retrieveSecondDependencyRequest,
      retrieveSecondDependencySuccessResponse
    )(mockServer);
    // act
    await vscode.commands.executeCommand(CommandId.RETRIEVE_WITH_DEPENDENCIES, {
      name: endevorElement.elmName,
      uri: toVirtualDocUri(URI_SCHEME)({
        location: {
          baseUrl: mockServer.url + endevorBasePath,
          configuration: endevorInstance,
        },
        credential: endevorCredential,
        endevorElement,
        localTreeElement,
      }),
      type: 'ELEMENT',
    });
    // assert
    const elementRetrieveRequests = await retrieveElementEndpoint.getSeenRequests();
    expect(elementRetrieveRequests.length).eq(1);
    const dependenciesListRequests = await dependenciesListEndpoint.getSeenRequests();
    expect(dependenciesListRequests.length).eq(1);
    const firstDependencyRetrieveRequests = await firstDependencyRetrieveEndpoint.getSeenRequests();
    expect(firstDependencyRetrieveRequests.length).eq(1);
    const secondDependencyRetrieveRequests = await secondDependencyRetrieveEndpoint.getSeenRequests();
    expect(secondDependencyRetrieveRequests.length).eq(1);

    const activeElementContent = vscode.window.activeTextEditor?.document.getText();
    expect(activeElementContent).eq(elementContent);

    const elementExisted = await checkExistence(retrievedElementPath);
    if (!elementExisted) {
      assert.fail(`File: ${retrievedElementPath} does not exists`);
    }

    const actualFirstDependencyContent = await safeReadFile(
      retrievedFirstDependencyPath
    );
    if (isError(actualFirstDependencyContent)) {
      const error = actualFirstDependencyContent;
      assert.fail(
        `File: ${retrievedFirstDependencyPath} does not exists, error: ${error.message}`
      );
    }
    expect(
      actualFirstDependencyContent.equals(
        new TextEncoder().encode(firstDependencyContent)
      )
    ).true;

    const actualSecondDependencyContent = await safeReadFile(
      retrievedSecondDependencyPath
    );
    if (isError(actualSecondDependencyContent)) {
      const error = actualSecondDependencyContent;
      assert.fail(
        `File: ${retrievedSecondDependencyPath} does not exists, error: ${error.message}`
      );
    }
    expect(
      actualSecondDependencyContent.equals(
        new TextEncoder().encode(secondDependencyContent)
      )
    ).true;
  });

  it('should retrieve element from Endevor even without dependencies', async () => {
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

    const emptyDependencies: Array<DependentElement> = [];
    const dependenciesListSuccessResponse: MockResponse<EndevorResponseData> = {
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
            ...endevorElement,
            components: emptyDependencies,
          },
        ],
        messages: [],
      },
    };
    const dependenciesListEndpoint = await mockEndpoint(
      dependenciesListRequest,
      dependenciesListSuccessResponse
    )(mockServer);

    // act
    await vscode.commands.executeCommand(CommandId.RETRIEVE_WITH_DEPENDENCIES, {
      name: endevorElement.elmName,
      uri: toVirtualDocUri(URI_SCHEME)({
        location: {
          baseUrl: mockServer.url + endevorBasePath,
          configuration: endevorInstance,
        },
        credential: endevorCredential,
        endevorElement,
        localTreeElement,
      }),
      type: 'ELEMENT',
    });
    // assert
    const elementRetrieveRequests = await retrieveElementEndpoint.getSeenRequests();
    expect(elementRetrieveRequests.length).eq(1);
    const dependenciesListRequests = await dependenciesListEndpoint.getSeenRequests();
    expect(dependenciesListRequests.length).eq(1);

    const activeElementContent = vscode.window.activeTextEditor?.document.getText();
    expect(activeElementContent).eq(elementContent);

    const elementExisted = await checkExistence(retrievedElementPath);
    if (!elementExisted) {
      assert.fail(`File: ${retrievedElementPath} does not exists`);
    }
  });

  it('should not save dependencies without content', async () => {
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

    const dependenciesListSuccessResponse: MockResponse<EndevorResponseData> = {
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
            ...endevorElement,
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

    const retrieveSecondDependencyErrorResponse: MockResponse<EndevorResponseData> = {
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
    await vscode.commands.executeCommand(CommandId.RETRIEVE_WITH_DEPENDENCIES, {
      name: endevorElement.elmName,
      uri: toVirtualDocUri(URI_SCHEME)({
        location: {
          baseUrl: mockServer.url + endevorBasePath,
          configuration: endevorInstance,
        },
        credential: endevorCredential,
        endevorElement,
        localTreeElement,
      }),
      type: 'ELEMENT',
    });
    // assert
    const elementRetrieveRequests = await retrieveElementEndpoint.getSeenRequests();
    expect(elementRetrieveRequests.length).eq(1);
    const dependenciesListRequests = await dependenciesListEndpoint.getSeenRequests();
    expect(dependenciesListRequests.length).eq(1);
    const firstDependencyRetrieveRequests = await firstDependencyRetrieveEndpoint.getSeenRequests();
    expect(firstDependencyRetrieveRequests.length).eq(1);
    const secondDependencyRetrieveRequests = await secondDependencyRetrieveEndpoint.getSeenRequests();
    expect(secondDependencyRetrieveRequests.length).eq(1);

    const activeElementContent = vscode.window.activeTextEditor?.document.getText();
    expect(activeElementContent).eq(elementContent);

    const elementExisted = await checkExistence(retrievedElementPath);
    if (!elementExisted) {
      assert.fail(`File: ${retrievedElementPath} does not exists`);
    }

    const actualFirstDependencyContent = await safeReadFile(
      retrievedFirstDependencyPath
    );
    if (isError(actualFirstDependencyContent)) {
      const error = actualFirstDependencyContent;
      assert.fail(
        `File: ${retrievedFirstDependencyPath} does not exists, error: ${error.message}`
      );
    }
    expect(
      actualFirstDependencyContent.equals(
        new TextEncoder().encode(firstDependencyContent)
      )
    ).true;

    const secondDependencyExisted = await checkExistence(
      retrievedSecondDependencyPath
    );
    if (secondDependencyExisted) {
      assert.fail(`File: ${retrievedSecondDependencyPath} should not exists`);
    }
  });
});
