import * as assert from 'assert';

import * as vscode from 'vscode';
import { COMMAND_PREFIX } from '../constants';
import { getExtension } from '../vscodeTestUtils';
import { CommandId } from '../commands/id';
import { Command, Extension } from '@local/extension/_doc/Extension';

describe('Extension Commands', () => {
  let extension: vscode.Extension<Extension>;

  before(async () => {
    extension = getExtension();
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  it('Have UI defined in extension manifest', () => {
    // see https://code.visualstudio.com/api/references/contribution-points#contributes.commands
    const commands: string[] = Object.values(CommandId);
    const manifestCommands = extension.packageJSON.contributes.commands.map(
      (command: Command) => command.command
    );

    assert.deepStrictEqual(
      [
        ...manifestCommands,
        `${COMMAND_PREFIX}.printElement`, // printElement does not have UI
      ].sort(),
      commands.sort()
    );
  });

  it('Are registered', async () => {
    const commands: string[] = Object.values(CommandId).sort();

    const treeViewId = `elmTreeView`;
    const registeredCommands = (await vscode.commands.getCommands(true))
      .filter((c) => c.startsWith(COMMAND_PREFIX + `.`))
      // treeView starts with the same prefix
      .filter((c) => !c.startsWith(COMMAND_PREFIX + `.${treeViewId}`));

    assert.deepStrictEqual(registeredCommands.sort(), commands.sort());
  });
});
