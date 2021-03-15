import * as vscode from 'vscode';
import { Logger } from '@local/extension/_doc/Logger';
import { UnreachableCaseError } from '@local/endevor/typeHelpers';

enum LOGEVEL {
  TRACE,
  INFO,
  WARN,
  ERROR,
}

interface IChannel {
  appendLine: (line: string) => void;
}

const format = (userMsg: string, logMsg?: string) =>
  logMsg ? `${userMsg} (see OUTPUT for more details)` : userMsg;

const prependTimestamp = (message: string): string =>
  `${new Date().toISOString()} - ${message}`;

const logAndDisplay = (outputChannel: IChannel) => (lvl: LOGEVEL) => (
  userMsg: string,
  logMsg?: string
) => {
  outputChannel.appendLine(prependTimestamp(userMsg));
  if (logMsg) outputChannel.appendLine(prependTimestamp(logMsg));

  switch (lvl) {
    case LOGEVEL.TRACE:
      break;
    case LOGEVEL.INFO:
      vscode.window.showInformationMessage(format(userMsg, logMsg));
      break;
    case LOGEVEL.WARN:
      vscode.window.showWarningMessage(format(userMsg, logMsg));
      break;
    case LOGEVEL.ERROR:
      vscode.window.showErrorMessage(format(userMsg, logMsg));
      break;
    default:
      throw new UnreachableCaseError(lvl);
  }
};

export const make = (outputChannel: vscode.OutputChannel): Logger => {
  const log = logAndDisplay(outputChannel);

  return {
    trace: (msg: string) => log(LOGEVEL.TRACE)(msg),
    info: log(LOGEVEL.INFO),
    warn: log(LOGEVEL.WARN),
    error: log(LOGEVEL.ERROR),
  };
};
