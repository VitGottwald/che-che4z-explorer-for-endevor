import * as vscode from 'vscode';
import { PromptInputOptions } from './_doc/InputBox';
import { Logger } from '@local/extension/_doc/Logger';
import { make as makeLogger } from './logger';

export const showInputBox = (
  options: PromptInputOptions
): Thenable<string | undefined> =>
  vscode.window.showInputBox({
    ...options,
    ignoreFocusOut: true,
  });

export const showVscodeQuickPick = (
  items: vscode.QuickPickItem[],
  showOptions?: vscode.QuickPickOptions
): Thenable<vscode.QuickPickItem | undefined> => {
  return vscode.window.showQuickPick(items, showOptions);
};

export const updateGlobalEndevorConfiguration = (
  configurationKey: string
) => async <T>(
  settingsKey: string,
  newSettingsValue: Readonly<T>
): Promise<void> => {
  await vscode.workspace
    .getConfiguration(configurationKey)
    .update(settingsKey, newSettingsValue, vscode.ConfigurationTarget.Global);
};

export const getEndevorConfigurationValue = (configurationKey: string) => <T>(
  settingsKey: string,
  defaultValue: Readonly<T>
): Readonly<T> => {
  return vscode.workspace
    .getConfiguration(configurationKey)
    .get(settingsKey, defaultValue);
};

export const showWebView = (webViewType: string) => (
  title: string,
  body: string
): void => {
  const panelIdentificationType = webViewType;
  const panelLocation = vscode.window.activeTextEditor?.viewColumn || 1;
  const panel = vscode.window.createWebviewPanel(
    panelIdentificationType,
    title,
    panelLocation
  );
  panel.webview.html = body;
};

export const createLogger = (name: string): Logger => {
  const outputChannel = vscode.window.createOutputChannel(name);
  return makeLogger(outputChannel);
};
