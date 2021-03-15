import { logger } from '../globals';
import { ElementNode, Node } from '../_doc/ElementTree';
import {
  filterElementNodes,
  toEditFileName,
  isDefined,
  isError,
  getEditFolderUri,
} from '../utils';
import { Uri } from 'vscode';
import {
  createDirectory,
  getWorkspaceUri,
  saveFileIntoWorkspaceFolder,
} from '@local/vscode-wrapper/workspace';
import { retrieveElementWithFingerprint } from '../endevor';
import {
  EndevorElement,
  EndevorElementLocation,
  EndevorLocation,
} from '@local/endevor/_doc/Endevor';
import { EndevorCredential } from '@local/endevor/_doc/Credential';
import { getQuickEditLocation } from '../settings/settings';
import { showSavedElementContent } from '../workspace';
import { URI_SCHEME } from '../constants';
import { fromVirtualDocUri, toVirtualDocUri } from '../uri';

type SelectedElementNode = ElementNode;
type SelectedMultipleNodes = Node[];

export const editElementCommand = async (
  elementNode?: SelectedElementNode,
  nodes?: SelectedMultipleNodes
) => {
  if (nodes) {
    const elementNodes = filterElementNodes(nodes);
    logger.trace(
      `Edit command was called for ${elementNodes
        .map((node) => node.name)
        .join(',')}`
    );
    await editMultipleElements(elementNodes);
  } else if (elementNode) {
    logger.trace(`Edit command was called for ${elementNode.name}`);
    await editSingleElement(elementNode);
  }
};

const editMultipleElements = async (
  elements: ReadonlyArray<{
    name: string;
    uri: Uri;
  }>
): Promise<void> => {
  const workspaceUri = await getWorkspaceUri();
  if (!workspaceUri) {
    logger.error(
      'At least one workspace in this project should be opened to edit elements'
    );
    return;
  }
  const retrieveResult = await Promise.all(
    elements
      .map((element) => fromVirtualDocUri(element.uri))
      .map(async (elementUri) => {
        const retrieveResult = await retrieveIntoWorkspace(workspaceUri)(
          elementUri
        );
        if (isError(retrieveResult)) {
          const error = retrieveResult;
          return error;
        }
        const savedElementUri = retrieveResult;
        return await showElementToEdit(savedElementUri, elementUri);
      })
  );
  const errors = retrieveResult
    .map((value) => {
      if (isError(value)) return value;
      return undefined;
    })
    .filter(isDefined);
  if (errors.length) {
    logger.error(
      `There were some issues during retrieving elements: ${elements
        .map((element) => element.name)
        .join(', ')}: ${JSON.stringify(errors.map((error) => error.message))}`
    );
  }
};

const editSingleElement = async (element: {
  name: string;
  uri: Uri;
}): Promise<void> => {
  const workspaceUri = await getWorkspaceUri();
  if (!workspaceUri) {
    logger.error(
      'At least one workspace in this project should be opened to edit elements'
    );
    return;
  }
  const elementUri = fromVirtualDocUri(element.uri);
  const retrieveResult = await retrieveIntoWorkspace(workspaceUri)(elementUri);
  if (isError(retrieveResult)) {
    const error = retrieveResult;
    logger.error(error.message);
    return;
  }
  const savedElementUri = retrieveResult;
  const showResult = await showElementToEdit(savedElementUri, elementUri);
  if (isError(showResult)) {
    const error = showResult;
    logger.error(error.message);
    return;
  }
};

type ElementConsumer = (
  element: {
    typeName: string;
    elmName: string;
    fileExt?: string;
  },
  elementContent: string,
  fingerprint: string
) => Promise<Uri | Error>;

type RetrieveOptions = Readonly<{
  location: EndevorLocation;
  credential: EndevorCredential;
  endevorElement: EndevorElement;
}>;

const retrieveInto = (consumer: ElementConsumer) => async ({
  location,
  credential,
  endevorElement,
}: RetrieveOptions): Promise<Uri | Error> => {
  const retrievedElement = await retrieveElementWithFingerprint(
    location,
    credential,
    endevorElement
  );
  if (!retrievedElement) {
    return new Error(
      `Element ${endevorElement.elmName} was not retrieved successfully from Endevor`
    );
  }
  return consumer(
    endevorElement,
    retrievedElement.element,
    retrievedElement.fingerprint
  );
};

const retrieveIntoWorkspace = (workspaceUri: Uri) => async (
  retrieveOptions: RetrieveOptions
): Promise<Uri | Error> => {
  return await retrieveInto(saveIntoEditFolder(workspaceUri))(retrieveOptions);
};

const saveIntoEditFolder = (workspaceUri: Uri) => async (
  element: {
    typeName: string;
    elmName: string;
    fileExt?: string;
  },
  elementContent: string,
  fingerprint: string
): Promise<Uri | Error> => {
  let editFolder: string;
  try {
    editFolder = getQuickEditLocation();
  } catch (error) {
    logger.trace(`Error when reading settings: ${error}`);
    return new Error('Unable to get edit path from settings');
  }
  const saveLocationUri = await createDirectory(
    getEditFolderUri(workspaceUri)(editFolder)
  );
  const saveResult = await saveFileIntoWorkspaceFolder(saveLocationUri)(
    {
      fileName: toEditFileName({
        elementName: element.elmName,
        fingerprint,
      }),
      fileExtension: element.fileExt,
    },
    elementContent
  );
  if (isError(saveResult)) {
    const error = saveResult;
    logger.trace(`Element: ${element.elmName} persisting error: ${error}`);
    const userMessage = `Element: ${element.elmName} was not saved into file system`;
    return new Error(userMessage);
  }
  const savedFileUri = saveResult;
  return savedFileUri;
};

const showElementToEdit = async (
  fileUri: Uri,
  uploadOptions: {
    location: EndevorLocation;
    credential: EndevorCredential;
    endevorElement: EndevorElement;
    localTreeElement: EndevorElementLocation;
  }
): Promise<void | Error> => {
  const uploadableElementUri = await saturateWithUploadOptions(fileUri)(
    uploadOptions
  );
  const showResult = await showSavedElementContent(uploadableElementUri);
  if (isError(showResult)) {
    const error = showResult;
    logger.trace(
      `Element ${fileUri.fsPath} cannot be opened because of: ${error}.`
    );
    return new Error(`Element ${fileUri.fsPath} cannot be opened.`);
  }
};

// TODO: needs to be refactored, we ruin our URI abstraction here,
// because now, we know, where the location and etc stored
const saturateWithUploadOptions = (fileUri: Uri) => async (uploadOptions: {
  location: EndevorLocation;
  credential: EndevorCredential;
  endevorElement: EndevorElement;
  localTreeElement: EndevorElementLocation;
}): Promise<Uri> => {
  const elementUri = toVirtualDocUri(URI_SCHEME)({
    location: uploadOptions.location,
    credential: uploadOptions.credential,
    endevorElement: uploadOptions.endevorElement,
    localTreeElement: uploadOptions.localTreeElement,
  });
  return fileUri.with({
    query: elementUri.query,
  });
};
