import { logger } from '../globals';
import { ElementNode, Node } from '../_doc/ElementTree';
import { renderElementAttributes } from '../view/elementAttributes';
import { showWebView } from '@local/vscode-wrapper/vscode-wrapper';
import { filterElementNodes } from '../utils';
import { COMMAND_PREFIX } from '../constants';
import { fromVirtualDocUri } from '../uri';

type SelectedElementNode = ElementNode;
type SelectedMultipleNodes = Node[];

export const viewElementDetails = (
  elementNode?: SelectedElementNode,
  nodes?: SelectedMultipleNodes
): void => {
  if (nodes) {
    const elementNodes = filterElementNodes(nodes);
    logger.trace(
      `View element details command was called for ${elementNodes
        .map((node) => node.name)
        .join(',')}`
    );
    elementNodes.forEach((elementNode) => showElementAttributes(elementNode));
  } else if (elementNode) {
    logger.trace(
      `View element details command was called for ${elementNode.name}`
    );
    showElementAttributes(elementNode);
  }
};

const showElementAttributes = (elementNode: ElementNode): void => {
  let element;
  try {
    element = fromVirtualDocUri(elementNode.uri).endevorElement;
  } catch (error) {
    logger.error(
      `Element: ${elementNode.name} details cannot be shown`,
      `View element details command error with vscode uri parsing: ${error}`
    );
    return;
  }
  const panelTitle = element.elmName + ' - Details';
  const panelBody = renderElementAttributes(element);
  showWebView(COMMAND_PREFIX)(panelTitle, panelBody);
};
