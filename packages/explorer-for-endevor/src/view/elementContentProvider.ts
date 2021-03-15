import type {
  Uri,
  CancellationToken,
  TextDocumentContentProvider,
} from 'vscode';
import { printElement } from '../endevor';
import { logger } from '../globals';
import { fromVirtualDocUri } from '../uri';

export const elementContentProvider: TextDocumentContentProvider = {
  provideTextDocumentContent(
    uri: Uri,
    _token: CancellationToken
  ): Promise<string | undefined> {
    logger.trace(
      `Print element uri: \n  ${decodeURIComponent(uri.toString())}`
    );
    const { location, credential, endevorElement } = fromVirtualDocUri(uri);
    return printElement(location, credential, endevorElement);
  },
};
