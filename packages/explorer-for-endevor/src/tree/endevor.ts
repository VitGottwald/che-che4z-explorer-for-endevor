import {
  Systems,
  SystemNode,
  SubSystemNode,
  TypeNode,
  ElementNode,
} from '../_doc/ElementTree';
import {
  EndevorElement,
  EndevorElementLocation,
  EndevorLocation,
} from '@local/endevor/_doc/Endevor';
import { EndevorCredential } from '@local/endevor/_doc/Credential';
import { URI_SCHEME } from '../constants';
import { toVirtualDocUri } from '../uri';

/**
 * Converts list element result into a tree for tree view
 */
export const buildTree = (
  location: EndevorLocation,
  elementsSearchLocation: EndevorElementLocation,
  credential: EndevorCredential,
  elements: EndevorElement[]
): SystemNode[] => {
  const systems: Systems = new Map();

  const addSystemNode = (elm: EndevorElement): SystemNode => {
    const name = elm.sysName;
    const node: SystemNode = systems.get(name) ?? {
      type: 'SYS',
      name,
      children: new Map(),
    };
    systems.set(name, node);

    return node;
  };

  const addSubSystemNode = (element: EndevorElement): SubSystemNode => {
    const system = addSystemNode(element);
    const name = element.sbsName;
    const node: SubSystemNode = system.children.get(name) ?? {
      type: 'SUB',
      name,
      children: new Map(),
    };
    system.children.set(name, node);

    return node;
  };

  const addTypeNode = (element: EndevorElement): TypeNode => {
    const subsystem = addSubSystemNode(element);
    const name = element.typeName;
    const node: TypeNode = subsystem.children.get(name) ?? {
      type: 'TYPE',
      name,
      children: new Map(),
    };
    subsystem.children.set(name, node);

    return node;
  };

  const addElementNode = async (
    endevorElement: EndevorElement
  ): Promise<void> => {
    const type = addTypeNode(endevorElement);
    const name = endevorElement.elmName;
    const node: ElementNode = {
      type: 'ELEMENT',
      name,
      uri: toVirtualDocUri(URI_SCHEME)({
        location,
        credential,
        endevorElement,
        localTreeElement: elementsSearchLocation,
      }),
    };
    type.children.set(name, node);
  };

  elements.forEach(addElementNode);

  return Array.from(systems.values());
};
