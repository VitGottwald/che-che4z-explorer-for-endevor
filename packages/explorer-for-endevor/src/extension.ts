import { logger } from './globals'; // this import has to be first, it initializes global state
import * as vscode from 'vscode';
import { TREE_VIEW_ID, URI_SCHEME } from './constants';
import { elementContentProvider } from './view/elementContentProvider';
import { make as makeElmTreeProvider } from './tree/provider';
import {
  watchForLocations,
  dispatch as settingsDispatch,
  getLocations,
} from './settings/settings';
import { Extension } from '@local/extension/_doc/Extension';
import { CommandId } from './commands/id';
import { printElement } from './commands/printElement';
import { addNewService } from './commands/addNewService';
import { Servers } from './_doc/ElementTree';
import { addNewElementLocation } from './commands/addNewElementLocation';
import { hideElementLocation } from './commands/hideElementLocation';
import { hideService } from './commands/hideService';
import { viewElementDetails } from './commands/viewElementDetails';
import { retrieveElementCommand } from './commands/retrieveElement';
import { retrieveWithDependencies } from './commands/retrieveWithDependencies';
import { editElementCommand } from './commands/editElement';
import { uploadElementCommand } from './commands/uploadElement';

const getServers = (): Servers => {
  const locations = getLocations();
  return locations.map((location) => ({
    type: 'SERVER',
    name: location.service,
    children: location.elementLocations.map((elementLocation) => ({
      type: 'LOCATION',
      name: elementLocation,
      serviceName: location.service,
    })),
  }));
};

export const activate: Extension['activate'] = async (context) => {
  logger.trace('Activation requested');
  const [elmTreeProvider, refreshTreeView] = makeElmTreeProvider(getServers);

  const commands = [
    [CommandId.PRINT_ELEMENT, printElement],
    [CommandId.REFRESH_TREE_VIEW, refreshTreeView],
    [CommandId.ADD_NEW_SERVICE, addNewService],
    [CommandId.ADD_NEW_ELEMENT_LOCATION, addNewElementLocation],
    [CommandId.HIDE_ELEMENT_LOCATION, hideElementLocation],
    [CommandId.HIDE_SERVICE, hideService],
    [CommandId.VIEW_ELEMENT_DETAILS, viewElementDetails],
    [CommandId.RETRIEVE_ELEMENT, retrieveElementCommand],
    [CommandId.RETRIEVE_WITH_DEPENDENCIES, retrieveWithDependencies],
    [CommandId.QUICK_EDIT_ELEMENT, editElementCommand],
    [
      CommandId.GENERATE_ELEMENT,
      () => {
        logger.info('generate command was called');
      },
    ],
  ] as const;

  context.subscriptions.push(
    vscode.window.createTreeView(TREE_VIEW_ID, {
      treeDataProvider: elmTreeProvider,
      canSelectMany: true,
    }),
    vscode.workspace.registerTextDocumentContentProvider(
      URI_SCHEME,
      elementContentProvider
    ),

    ...commands.map(([id, command]) =>
      vscode.commands.registerCommand(id, command)
    ),
    watchForLocations(settingsDispatch),
    vscode.workspace.onDidSaveTextDocument((document) =>
      uploadElementCommand(document.uri)(document.getText())
    )
  );
};

export const deactivate: Extension['deactivate'] = () => {
  logger.trace('Deactivation requested');
};

// because a vscode command can be an arbitrary function
// we have to resort to using `any` here
