import {
  createNewWorkspaceDirectory,
  saveFileIntoWorkspaceFolder,
  showFileContent,
} from '@local/vscode-wrapper/workspace';
import { Uri } from 'vscode';
import * as path from 'path';

type ElementDescription = Readonly<{
  typeName: string;
  elmName: string;
  fileExt?: string;
}>;

export const saveElementIntoWorkspace = (workspaceUri: Uri) => async (
  element: ElementDescription,
  elementContent: string
): Promise<Uri | Error> => {
  try {
    const file = toFileDescription(element);
    const elementDir = file.workspaceDirectoryPath;
    const directoryToSave = await createNewWorkspaceDirectory(workspaceUri)(
      elementDir
    );
    return await saveFileIntoWorkspaceFolder(directoryToSave)(
      file,
      elementContent
    );
  } catch (e) {
    return e;
  }
};

const toFileDescription = (element: ElementDescription) => {
  const elementDir = path.join(`/`, element.typeName);
  return {
    fileName: element.elmName,
    fileExtension: element.fileExt,
    workspaceDirectoryPath: elementDir,
  };
};

export const showSavedElementContent = async (
  fileUri: Uri
): Promise<void | Error> => {
  try {
    await showFileContent(fileUri);
  } catch (e) {
    return e;
  }
};
