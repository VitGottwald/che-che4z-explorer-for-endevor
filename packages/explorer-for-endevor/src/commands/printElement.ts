import * as vscode from 'vscode';
import { logger } from '../globals';
import { OUTPUT_CHANNEL_NAME } from '../constants';

export const printElement = async (resourceUri: vscode.Uri) => {
  try {
    await vscode.window.showTextDocument(resourceUri);
  } catch (error) {
    logger.error(
      `Error encountered when printing the element. (see OUTPUT - ${OUTPUT_CHANNEL_NAME} for more details.)`
    );
  }
};
