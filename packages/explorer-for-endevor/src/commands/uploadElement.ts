import { EndevorCredential } from '@local/endevor/_doc/Credential';
import { EndevorElement, EndevorLocation } from '@local/endevor/_doc/Endevor';
import { fromVirtualDocUri } from '@local/vscode-wrapper/uri';
import { deleteFile, getWorkspaceUri } from '@local/vscode-wrapper/workspace';
import { commands, Uri } from 'vscode';
import {
  askForChangeControlValue,
  dialogCancelled,
} from '../dialogs/change-control/endevorChangeControlDialogs';
import { updateElement } from '../endevor';
import { logger } from '../globals';
import { getQuickEditLocation } from '../settings/settings';
import {
  fromEditFileName,
  getEditFolderUri,
  isError,
  splitIntoPathAndFileName,
} from '../utils';

export const uploadElementCommand = (elementUri: Uri) => async (
  content: string
): Promise<void> => {
  logger.trace(`Upload element command was called for: ${elementUri}`);
  const workspace = await getWorkspaceUri();
  if (!workspace) return undefined;
  let editFolder;
  try {
    editFolder = getQuickEditLocation();
  } catch (e) {
    logger.error(
      'Unable to get edit folder from settings.',
      `Error when reading settings: ${e}.`
    );
    return undefined;
  }
  const { fsPath: editFolderPath } = getEditFolderUri(workspace)(editFolder);
  const { path, fileName } = splitIntoPathAndFileName(elementUri.fsPath);
  if (isEditedElement(editFolderPath)(path)) {
    const editFileParams = fromEditFileName(fileName);
    if (!editFileParams) {
      logger.error(
        `Edited file: ${fileName} become inconsistent.`,
        `File with wrong name pattern: ${fileName} was saved into edited folder: ${editFolder}.`
      );
      return undefined;
    }
    const uploadResult = await uploadElement(fromVirtualDocUri(elementUri))({
      fingerprint: editFileParams.fingerprint,
      content,
    });
    if (isError(uploadResult)) {
      const error = uploadResult;
      logger.error(error.message);
      return undefined;
    }
    await closeEditSession(elementUri);
  }
};

const isEditedElement = (editFolderPath: string) => (
  elementFolderPath: string
): boolean => {
  return editFolderPath === elementFolderPath;
};

type UploadOptions = Readonly<{
  location: EndevorLocation;
  credential: EndevorCredential;
  element: EndevorElement;
}>;

type ElementToUpload = Readonly<{
  content: string;
  fingerprint: string;
}>;

const uploadElement = ({
  location,
  credential,
  element,
}: UploadOptions) => async ({
  content,
  fingerprint,
}: ElementToUpload): Promise<void | Error> => {
  const changeControlValue = await askForChangeControlValue({});
  if (dialogCancelled(changeControlValue)) {
    return new Error('CCID and Comment must be specified to upload element.');
  }
  const updateResult = await updateElement(
    location,
    credential,
    element
  )({
    fingerprint,
    content,
    ccid: changeControlValue.ccid,
    comment: changeControlValue.comment,
  });
  if (isError(updateResult)) {
    const error = updateResult;
    return error;
  }
};

const closeEditSession = async (elementUri: Uri) => {
  await commands.executeCommand('workbench.action.closeActiveEditor');
  try {
    await deleteFile(elementUri);
  } catch (e) {
    logger.error(
      `Edited file: ${elementUri.fsPath} was not deleted correctly.`,
      `Edited file: ${elementUri.fsPath} was not deleted because of: ${e}.`
    );
  }
};
