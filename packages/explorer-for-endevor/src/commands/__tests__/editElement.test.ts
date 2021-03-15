import * as vscode from 'vscode';
import { Extension } from '@local/extension/_doc/Extension';
import { before, describe } from 'mocha';
import { getExtension } from '../../vscodeTestUtils';
import { CommandId } from '../id';
import {
  QUICK_EDIT_DOWNLOAD_FOLDER_DEFAULT,
  URI_SCHEME,
} from '../../constants';
import {
  EndevorElement,
  EndevorElementLocation,
} from '@local/endevor/_doc/Endevor';
import { BaseCredential, CredentialType } from '@local/endevor/_doc/Credential';
import { getLocal } from 'mockttp';
import { mockEndpoint } from '@local/endevor/testUtils';
import { MockRequest, MockResponse } from '@local/endevor/_doc/MockServer';
import * as fs from 'fs';
import { assert, expect } from 'chai';
import * as path from 'path';
import { fromVirtualDocUri, toVirtualDocUri } from '../../uri';

// utility functions
const basicAuthHeader = ({ user, password }: BaseCredential): string => {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
};

const requestPath = (
  { envName, stgNum, sysName, sbsName, typeName, elmName }: EndevorElement,
  basePath: string,
  instance: string
): string => {
  return `${basePath}/${instance}/env/${envName}/stgnum/${stgNum}/sys/${sysName}/subsys/${sbsName}/type/${typeName}/ele/${elmName}`;
};

describe('editing elements', () => {
  const endevorElement: EndevorElement = {
    envName: 'SMPLPROD',
    stgNum: '1',
    sysName: 'FINANCE',
    sbsName: 'ACCTREC',
    typeName: 'COBOL',
    elmName: 'TEST',
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
  const endevorCredential: BaseCredential = {
    type: CredentialType.BASE,
    user: 'user',
    password: 'pass',
  };

  const testWorkspace = vscode.Uri.file(
    path.join(__dirname, '../../../workspace/')
  );

  const endevorBasePath = '/EndevorService/api/v2';
  const endevorInstance = 'WEBMFTST';
  const mockServer = getLocal();
  const retrieveRequest: MockRequest<null> = {
    method: 'GET',
    path: requestPath(endevorElement, endevorBasePath, endevorInstance),
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
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  it('should show element for editing', async () => {
    // arrange
    const elementContent = 'Lets eat some sandwiches!!\n';
    const successResponse: MockResponse<string> = {
      status: 200,
      statusMessage: 'OK',
      headers: {
        fingerprint: '01343CB60041A',
        version: '2.1',
        'content-type': 'application/octet-stream',
      },
      data: elementContent,
    };
    const endpoint = await mockEndpoint(
      retrieveRequest,
      successResponse
    )(mockServer);
    // act
    const endevorLocation = {
      baseUrl: mockServer.url + endevorBasePath,
      configuration: endevorInstance,
    };
    await vscode.commands.executeCommand(CommandId.QUICK_EDIT_ELEMENT, {
      name: endevorElement.elmName,
      uri: toVirtualDocUri(URI_SCHEME)({
        location: endevorLocation,
        credential: endevorCredential,
        endevorElement,
        localTreeElement,
      }),
      type: 'ELEMENT',
    });
    // assert
    const seenRequests = await endpoint.getSeenRequests();
    expect(seenRequests.length).eq(1);

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      assert.fail('Active editor should be opened with element for editing!');
    }
    const showedElementContent = activeEditor.document.getText();
    expect(showedElementContent).eq(elementContent);
    const showedElementUri = activeEditor.document.uri;
    assert.deepEqual(fromVirtualDocUri(showedElementUri), {
      location: endevorLocation,
      credential: endevorCredential,
      endevorElement,
      localTreeElement,
    });

    const retrievedFilePath = path.join(
      testWorkspace.fsPath,
      QUICK_EDIT_DOWNLOAD_FOLDER_DEFAULT,
      `${endevorElement.elmName}-version-01343CB60041A.${endevorElement.fileExt}`
    );
    try {
      await fs.promises.unlink(retrievedFilePath);
    } catch (e) {
      assert.fail(
        `File: ${retrievedFilePath} does not exists, error: ${e.message}`
      );
    }
  });
});
