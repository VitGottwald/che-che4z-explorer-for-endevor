import { TextEncoder } from 'util';
import * as vscode from 'vscode';
import * as path from 'path';

export const getWorkspaceUri = async (): Promise<vscode.Uri | undefined> => {
  const openedWorkspaces = vscode.workspace.workspaceFolders;
  if (!openedWorkspaces) {
    const noOpenedWorkspace = undefined;
    return noOpenedWorkspace;
  }
  const [openedWorkspace] = openedWorkspaces;
  return openedWorkspace?.uri;
};

// don't forget to validate promise.reject
export const createNewWorkspaceDirectory = (workspaceUri: vscode.Uri) => async (
  workspaceDirectoryPath: string
): Promise<vscode.Uri> => {
  const folderUri = toFolderUri(workspaceUri)(workspaceDirectoryPath);
  return await createDirectory(folderUri);
};

export const createDirectory = async (
  folderUri: vscode.Uri
): Promise<vscode.Uri> => {
  await vscode.workspace.fs.createDirectory(folderUri);
  return folderUri;
};

type WorkspaceFile = Readonly<{
  fileName: string;
  fileExtension?: string;
  workspaceDirectoryPath: string;
}>;

// don't forget to validate promise.reject
export const saveFileIntoWorkspace = (workspaceUri: vscode.Uri) => async (
  fileToSave: WorkspaceFile,
  fileContent: string
): Promise<vscode.Uri> => {
  const fileUri = toFileUri(workspaceUri)(fileToSave);
  await vscode.workspace.fs.writeFile(
    fileUri,
    new TextEncoder().encode(fileContent)
  );
  return fileUri;
};

const toFileUri = (workspaceUri: vscode.Uri) => (
  file: WorkspaceFile
): vscode.Uri => {
  const workspaceFolderUri = toFolderUri(workspaceUri)(
    file.workspaceDirectoryPath
  );
  return toFileInWorkspaceFolderUri(workspaceFolderUri)(file);
};

const toFolderUri = (workspaceUri: vscode.Uri) => (
  workspaceDirectoryPath: string
): vscode.Uri => {
  return vscode.Uri.file(
    path.join(workspaceUri.fsPath, workspaceDirectoryPath)
  );
};

const toFileInWorkspaceFolderUri = (folderUri: vscode.Uri) => (file: {
  fileName: string;
  fileExtension?: string;
}): vscode.Uri => {
  const { scheme, fsPath } = folderUri;
  if (file.fileExtension) {
    return vscode.Uri.parse('').with({
      scheme,
      path: path.join(fsPath, `${file.fileName}.${file.fileExtension}`),
    });
  } else {
    return vscode.Uri.parse('').with({
      scheme,
      path: path.join(fsPath, file.fileName),
    });
  }
};

// don't forget to validate promise.reject
export const saveFileIntoWorkspaceFolder = (folderUri: vscode.Uri) => async (
  fileToSave: {
    fileName: string;
    fileExtension?: string;
  },
  fileContent: string
): Promise<vscode.Uri> => {
  const fileUri = toFileInWorkspaceFolderUri(folderUri)(fileToSave);
  await vscode.workspace.fs.writeFile(
    fileUri,
    new TextEncoder().encode(fileContent)
  );
  return fileUri;
};

// don't forget to validate promise.reject
export const showWorkspaceFileContent = (workspaceUri: vscode.Uri) => async (
  file: WorkspaceFile
): Promise<void> => {
  const fileUri = toFileUri(workspaceUri)(file);
  await showFileContent(fileUri);
};

// don't forget to validate promise.reject
export const showFileContent = async (fileUri: vscode.Uri): Promise<void> => {
  const textFile = await vscode.workspace.openTextDocument(fileUri);
  await vscode.window.showTextDocument(textFile, { preview: false });
};

// don't forget to validate promise.reject
export const deleteFile = async (fileUri: vscode.Uri): Promise<void> => {
  return vscode.workspace.fs.delete(fileUri, { useTrash: true });
};
