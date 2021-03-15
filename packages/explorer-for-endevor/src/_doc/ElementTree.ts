import { Uri } from 'vscode';

export type Servers = ServerNode[];
export type Locations = LocationNode[];

export type Systems = Map<string, SystemNode>;
export type SubSystems = Map<string, SubSystemNode>;
export type Types = Map<string, TypeNode>;
export type Elements = Map<string, ElementNode>;

export type AddNewProfileNode = Readonly<{
  type: 'BUTTON_ADD_PROFILE';
  label: string;
  command: {
    command: string;
    title: string;
  };
}>;

export type ServerNode = Readonly<{
  type: 'SERVER';
  name: string;
  children: Locations;
}>;
export type LocationNode = Readonly<{
  type: 'LOCATION';
  name: string;
  serviceName: string;
  // baseUrl: EndevorUrl;
}>;

export type SystemNode = Readonly<{
  type: 'SYS';
  name: string;
  children: SubSystems;
}>;
export type SubSystemNode = Readonly<{
  type: 'SUB';
  name: string;
  children: Types;
}>;
export type TypeNode = Readonly<{
  type: 'TYPE';
  name: string;
  children: Elements;
}>;
export type ElementNode = Readonly<{
  type: 'ELEMENT';
  name: string;
  uri: Uri;
}>;
export type ElementLocationNode =
  | SystemNode
  | SubSystemNode
  | TypeNode
  | ElementNode;

export type Node =
  | AddNewProfileNode
  | ServerNode
  | LocationNode
  | ElementLocationNode;
