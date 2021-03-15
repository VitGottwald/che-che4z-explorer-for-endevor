import type { ExtensionContext } from 'vscode';
export interface Command {
  title: string;
  command: string;
  category: string;
}

export interface Extension {
  activate: (context: ExtensionContext) => Promise<void>;
  deactivate: () => void;
}
