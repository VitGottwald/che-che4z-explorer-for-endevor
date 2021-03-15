import * as vscode from 'vscode';
import { CommandId } from '../commands/id';
import {
  Node,
  ElementNode,
  ServerNode,
  LocationNode,
  AddNewProfileNode,
} from '../_doc/ElementTree';
import { EndevorElement, EndevorLocation } from '@local/endevor/_doc/Endevor';
import { addNewProfileButton } from './buttons';
import { searchForElements } from '../endevor';
import { buildTree } from './endevor';
import { toBaseUrl } from '@local/endevor/utils';
import { getEndevorServiceByName } from '../services/services';
import { getElementLocationByName } from '../element-locations/elementLocations';
import { UnreachableCaseError } from '@local/endevor/typeHelpers';
import { fromVirtualDocUri } from '../uri';

// TODO figure out how to enable multi selection (it is an option for createTreeView, but not for this)

class ElementItem extends vscode.TreeItem {
  constructor(node: ElementNode) {
    super(node.name, vscode.TreeItemCollapsibleState.None);

    this.resourceUri = node.uri;
    this.contextValue = 'ELEMENT_TYPE';

    this.command = {
      title: 'print',
      command: CommandId.PRINT_ELEMENT,
      tooltip: 'Print element',
      arguments: [this.resourceUri, node.name],
    };
  }
}

class LocationItem extends vscode.TreeItem {
  constructor(node: LocationNode) {
    super(node.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'ELEMENT_LOCATION';
  }
}
class ServerItem extends vscode.TreeItem {
  constructor(node: ServerNode) {
    super(node.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'ENDEVOR_SERVICE';
  }
}

interface TooltipArgs {
  location: EndevorLocation;
  endevorElement: EndevorElement;
}

const makeElemTooltip = ({
  location: { configuration },
  endevorElement,
}: TooltipArgs): string => {
  const tooltip =
    configuration && endevorElement
      ? `/${configuration}/${endevorElement.envName}/${endevorElement.sysName}/${endevorElement.sbsName}/${endevorElement.stgNum}`
      : '';
  return tooltip;
};

class ButtonItem extends vscode.TreeItem {
  constructor(node: AddNewProfileNode) {
    super(node.label, vscode.TreeItemCollapsibleState.None);
    this.label = node.label;
    this.command = node.command;
  }
}

const toTreeItem = (node: Node): vscode.TreeItem => {
  switch (node.type) {
    case 'BUTTON_ADD_PROFILE':
      return new ButtonItem(node);
    case 'SERVER':
      return new ServerItem(node);
    case 'LOCATION':
      return new LocationItem(node);
    case 'SYS':
    case 'SUB':
    case 'TYPE':
      return new vscode.TreeItem(
        node.name,
        vscode.TreeItemCollapsibleState.Collapsed
      );
    case 'ELEMENT': {
      const elmNode = new ElementItem(node);
      elmNode.tooltip = makeElemTooltip(fromVirtualDocUri(node.uri));
      return elmNode;
    }
    default:
      throw new UnreachableCaseError(node);
  }
};

const children = async (node: Node): Promise<Node[] | undefined> => {
  if (node.type === 'ELEMENT') {
    return []; // elemetns are leaf nodes and have no children
  }
  if (node.type === 'BUTTON_ADD_PROFILE') {
    return []; // buttons are leaf nodes and root at the same time, they don't have any children
  }
  /*
   * typescript's type inference is not able to handle
   * union discrimination in multiple switch cases at once
   * that's why the code bellow is repeated in all cases :-/
   */
  if (node.type === 'TYPE') {
    return Array.from(node.children.values());
  }
  if (node.type === 'SUB') {
    return Array.from(node.children.values());
  }
  if (node.type === 'SYS') {
    return Array.from(node.children.values());
  }
  if (node.type === 'SERVER') {
    return node.children;
  }
  if (node.type === 'LOCATION') {
    const endevorService = await getEndevorServiceByName(node.serviceName);
    if (!endevorService) {
      return [];
    }
    const elementsSearchLocation = await getElementLocationByName(node.name);
    if (!elementsSearchLocation) {
      return [];
    }
    const elements = await searchForElements(endevorService)(
      elementsSearchLocation
    );
    const endevorLocation: EndevorLocation = {
      baseUrl: toBaseUrl(endevorService.location),
      configuration: elementsSearchLocation.instance,
    };
    return buildTree(
      endevorLocation,
      elementsSearchLocation,
      endevorService.credential,
      elements
    );
  }
  throw new UnreachableCaseError(node); // make sure we covered all node.type cases
};

export const make = (
  getServers: () => readonly ServerNode[]
): [vscode.TreeDataProvider<Node>, () => void] => {
  const treeChangeEmitter = new vscode.EventEmitter<Node | null>();
  const elmListProvider: vscode.TreeDataProvider<Node> = {
    onDidChangeTreeData: treeChangeEmitter.event,
    getTreeItem(node: Node) {
      return toTreeItem(node);
    },
    getChildren(node?: Node) {
      if (node == null) {
        return [addNewProfileButton, ...getServers()];
      }
      return children(node);
    },
  };
  // tell vscode that root of the view has changed
  const refresh = () => treeChangeEmitter.fire(null);

  return [elmListProvider, refresh];
};
