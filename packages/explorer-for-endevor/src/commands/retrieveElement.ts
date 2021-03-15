import { retrieveElement } from '../endevor';
import { logger } from '../globals';
import { filterElementNodes, isDefined, isError } from '../utils';
import { ElementNode, Node } from '../_doc/ElementTree';
import { Uri } from 'vscode';
import { getWorkspaceUri } from '@local/vscode-wrapper/workspace';
import {
  saveElementIntoWorkspace,
  showSavedElementContent,
} from '../workspace';
import { EndevorElement, EndevorLocation } from '@local/endevor/_doc/Endevor';
import { EndevorCredential } from '@local/endevor/_doc/Credential';
import { fromVirtualDocUri } from '../uri';

type SelectedElementNode = ElementNode;
type SelectedMultipleNodes = Node[];

export const retrieveElementCommand = async (
  elementNode?: SelectedElementNode,
  nodes?: SelectedMultipleNodes
) => {
  if (nodes) {
    const elementNodes = filterElementNodes(nodes);
    logger.trace(
      `Retrieve element command was called for ${elementNodes
        .map((node) => node.name)
        .join(',')}`
    );
    await retrieveMultipleElements(elementNodes);
  } else if (elementNode) {
    logger.trace(`Retrieve element command was called for ${elementNode.name}`);
    await retrieveSingleElement(elementNode);
  }
};

const retrieveMultipleElements = async (
  elements: ReadonlyArray<{
    name: string;
    uri: Uri;
  }>
): Promise<void> => {
  const workspaceUri = await getWorkspaceUri();
  if (!workspaceUri) {
    logger.error(
      'At least one workspace in this project should be opened to retrieve elements'
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
        return await showElementInEditor(savedElementUri);
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

const retrieveSingleElement = async (
  element: Readonly<{
    name: string;
    uri: Uri;
  }>
): Promise<void> => {
  const workspaceUri = await getWorkspaceUri();
  if (!workspaceUri) {
    logger.error(
      'At least one workspace in this project should be opened to retrieve elements'
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
  const showResult = await showElementInEditor(savedElementUri);
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
  elementContent: string
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
  const elementContent = await retrieveElement(
    location,
    credential,
    endevorElement
  );
  if (!elementContent) {
    return new Error(
      `Element ${endevorElement.elmName} was not retrieved successfully from Endevor`
    );
  }
  return consumer(endevorElement, elementContent);
};

const retrieveIntoWorkspace = (workspaceUri: Uri) => async (
  retrieveOptions: RetrieveOptions
): Promise<Uri | Error> => {
  return await retrieveInto(saveIntoWorkspace(workspaceUri))(retrieveOptions);
};

const saveIntoWorkspace = (workspaceUri: Uri) => async (
  element: {
    typeName: string;
    elmName: string;
    fileExt?: string;
  },
  elementContent: string
): Promise<Uri | Error> => {
  const saveResult = await saveElementIntoWorkspace(workspaceUri)(
    element,
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

const showElementInEditor = async (fileUri: Uri): Promise<void | Error> => {
  const showResult = await showSavedElementContent(fileUri);
  if (isError(showResult)) {
    const error = showResult;
    logger.trace(
      `Element ${fileUri.fsPath} cannot be opened because of: ${error}.`
    );
    return new Error(`Element ${fileUri.fsPath} cannot be opened.`);
  }
};
