import * as vscode from 'vscode';
import { Extension } from '@local/extension/_doc/Extension';

// Test utilities that require `vscode` module

const extensionId = 'broadcomMFD.explorer-for-endevor';

export function getExtension(): vscode.Extension<Extension> {
  const ext = vscode.extensions.getExtension<Extension>(extensionId);
  if (!ext) {
    throw new Error('Extension was not found.');
  }
  return ext;
}
