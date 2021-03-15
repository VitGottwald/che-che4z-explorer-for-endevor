import { QuickPickItem, QuickPickOptions } from 'vscode';
import {
  showInputBox,
  showVscodeQuickPick,
} from '@local/vscode-wrapper/vscode-wrapper';
import { URL } from 'url';
import { logger } from '../../globals';
import { EndevorService } from '@local/endevor/_doc/Endevor';
import { CredentialType } from '@local/endevor/_doc/Credential';
import { ENDEVOR_V2_BASE_PATH } from '../../constants';
import { toEndevorProtocol } from '@local/endevor/utils';

type ChosenServiceName = string;
type CreatedService = {
  name: string;
  value: EndevorService;
};
type OperationCancelled = undefined;
type DialogResult = ChosenServiceName | CreatedService | OperationCancelled;

export const dialogCancelled = (
  value: DialogResult
): value is OperationCancelled => {
  return value === undefined;
};

export const serviceChosen = (
  value: DialogResult
): value is ChosenServiceName => {
  return typeof value === 'string';
};

export const askForServiceOrCreateNew = async (
  existingServices: ReadonlyArray<string>
): Promise<DialogResult> => {
  const createNewServiceItem: QuickPickItem = {
    label: '+ Create a New Endevor Profile',
  };
  const choice = await showServicesInQuickPick([
    createNewServiceItem,
    ...existingServices.map(toQuickPickItem),
  ]);
  if (operationCancelled(choice) || valueNotProvided(choice)) {
    logger.trace('Operation cancelled.');
    return undefined;
  }
  if (choice.label === createNewServiceItem.label) {
    const serviceName = await askForServiceName();
    if (operationCancelled(serviceName) || valueNotProvided(serviceName)) {
      logger.trace('No profile name was provided.');
      logger.trace('Operation cancelled.');
      return undefined;
    }
    const serviceValue = await askForServiceValue();
    if (operationCancelled(serviceValue) || valueNotProvided(serviceValue)) {
      logger.trace('No profile value was provided');
      logger.trace('Operation cancelled.');
      return undefined;
    }
    return {
      name: serviceName,
      value: serviceValue,
    };
  }
  return choice.label;
};

const toQuickPickItem = (input: string): QuickPickItem => {
  return {
    label: input,
  };
};

const showServicesInQuickPick = async (
  services: QuickPickItem[]
): Promise<QuickPickItem | undefined> => {
  const quickPickOptions: QuickPickOptions = {
    placeHolder:
      'Choose "Create new..." to define a new profile or select an existing one',
    ignoreFocusOut: true,
  };
  return showVscodeQuickPick(services, quickPickOptions);
};

const operationCancelled = <T>(value: T | undefined): value is undefined => {
  return value == undefined;
};

const valueNotProvided = <T>(value: T | undefined): value is undefined => {
  if (typeof value == 'boolean') {
    return !value.toString();
  }
  return !value;
};

const askForServiceName = async (): Promise<string | undefined> => {
  logger.trace('Prompt for profile name.');
  return showInputBox({
    prompt: 'Profile Name',
    placeHolder: 'Profile Name',
    validateInput: (value) =>
      value.length
        ? value.includes(' ')
          ? 'Profile name must not contain spaces'
          : undefined
        : 'Profile name must not be empty',
  });
};

const askForServiceValue = async (): Promise<EndevorService | undefined> => {
  const urlString = await askForUrl();
  if (operationCancelled(urlString) || valueNotProvided(urlString)) {
    logger.trace('No URL was provided.');
    return undefined;
  }
  const { protocol, hostname, port } = new URL(urlString);
  const endevorProtocol = toEndevorProtocol(protocol);
  if (!endevorProtocol) {
    logger.error(`Invalid protocol ${protocol}.`);
    return undefined;
  }
  const user = await askForUsername();
  if (operationCancelled(user)) {
    logger.trace('No username was provided.');
    return undefined;
  }
  const password = await askForPassword();
  if (operationCancelled(password)) {
    logger.trace('No password was provided.');
    return undefined;
  }
  const rejectUnauthorized = await askForUnauthorizedConnections();
  if (
    operationCancelled(rejectUnauthorized) ||
    valueNotProvided(rejectUnauthorized)
  ) {
    logger.trace('No unauthorized connection option was provided.');
    return undefined;
  }
  return {
    credential: {
      type: CredentialType.BASE,
      user,
      password,
    },
    location: {
      protocol: endevorProtocol,
      hostname,
      port: parseInt(port),
      basePath: ENDEVOR_V2_BASE_PATH,
    },
    rejectUnauthorized,
  };
};

const askForUrl = async (): Promise<string | undefined> => {
  logger.trace('Prompt for URL.');
  const urlPlaceholder = 'http(s)://example.com:port';
  return showInputBox({
    prompt: `Enter an Endevor URL in the format: ${urlPlaceholder}`,
    placeHolder: urlPlaceholder,
    validateInput: (value) => {
      try {
        const { protocol, hostname, port } = new URL(value);
        if (!toEndevorProtocol(protocol.toLowerCase())) {
          return `Invalid protocol ${protocol}, use http: or https: instead.`;
        }
        if (!hostname) {
          return `Hostname required`;
        }
        if (!port) {
          return `Port required`;
        }
        return;
      } catch (_error) {
        return `Enter an Endevor URL in the format: ${urlPlaceholder}`;
      }
    },
  });
};

const askForUsername = async (): Promise<string | undefined> => {
  logger.trace('Prompt for username.');
  return showInputBox({
    prompt: 'Enter the username for the connection.',
    placeHolder: '(Optional) Username',
  });
};

const askForPassword = async (): Promise<string | undefined> => {
  logger.trace('Prompt for password.');
  return showInputBox({
    prompt: 'Enter the password for the connection.',
    password: true,
    placeHolder: '(Optional) Password',
  });
};

const askForUnauthorizedConnections = async (): Promise<
  boolean | undefined
> => {
  logger.trace('Prompt for Reject Unauthorized option.');
  const rejectUnauthorizedOptions = [
    'True - Reject connections with self-signed certificates',
    'False - Accept connections with self-signed certificates',
  ];
  const choice = await showVscodeQuickPick(
    rejectUnauthorizedOptions.map(toQuickPickItem),
    {
      placeHolder: 'Reject Unauthorized Connections',
      ignoreFocusOut: true,
      canPickMany: false,
    }
  );
  if (!choice) {
    return undefined;
  }
  return Boolean(rejectUnauthorizedOptions.indexOf(choice.label));
};
