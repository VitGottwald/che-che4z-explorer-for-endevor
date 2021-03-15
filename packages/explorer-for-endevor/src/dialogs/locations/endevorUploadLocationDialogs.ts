import {
  EndevorElementLocation,
  UploadElementLocation,
} from '@local/endevor/_doc/Endevor';
import { showInputBox } from '@local/vscode-wrapper/vscode-wrapper';
import { logger } from '../../globals';
import { isError } from '../../utils';

type OperationCancelled = undefined;
type DialogResult = UploadElementLocation | OperationCancelled;

export const dialogCancelled = (
  dialogResult: DialogResult
): dialogResult is OperationCancelled => {
  return dialogResult === undefined;
};

type PrefilledElementLocation = EndevorElementLocation & {
  elmName: string;
};

export const askForUploadLocation = async (
  defaultValue: PrefilledElementLocation
): Promise<DialogResult> => {
  logger.trace('Prompt for upload location for the element.');
  const pathDelimiter = '/';
  const pathPartNames = [
    'environment',
    'stageNum',
    'system',
    'subsystem',
    'type',
    'element',
  ];
  const prettyPartNames = pathPartNames.join(pathDelimiter);

  type Result<T> = T | Error;
  const buildUploadPath = (
    pathParts: string[]
  ): Result<UploadElementLocation> => {
    const pathPartsRequiredAmount = pathPartNames.length;
    if (pathParts.length < pathPartsRequiredAmount) {
      return new Error(`should be ${prettyPartNames} specified`);
    }
    const environmentIndex = pathPartNames.indexOf('environment');
    const envName = validateValue(
      pathParts[environmentIndex],
      pathPartNames[environmentIndex]
    );
    if (isError(envName)) {
      const validationError = envName;
      return validationError;
    }
    const stageIndex = pathPartNames.indexOf('stageNum');
    const stgNum = validateEndevorStage(pathParts[stageIndex]);
    if (isError(stgNum)) {
      const validationError = stgNum;
      return validationError;
    }
    const systemIndex = pathPartNames.indexOf('system');
    const sysName = validateValue(
      pathParts[systemIndex],
      pathPartNames[systemIndex]
    );
    if (isError(sysName)) {
      const validationError = sysName;
      return validationError;
    }
    const subsystemIndex = pathPartNames.indexOf('subsystem');
    const sbsName = validateValue(
      pathParts[subsystemIndex],
      pathPartNames[subsystemIndex]
    );
    if (isError(sbsName)) {
      const validationError = sbsName;
      return validationError;
    }
    const typeIndex = pathPartNames.indexOf('type');
    const typeName = validateValue(
      pathParts[typeIndex],
      pathPartNames[typeIndex]
    );
    if (isError(typeName)) {
      const validationError = typeName;
      return validationError;
    }
    const elementIndex = pathPartNames.indexOf('element');
    const elmName = validateValue(
      pathParts[elementIndex],
      pathPartNames[elementIndex]
    );
    if (isError(elmName)) {
      const validationError = elmName;
      return validationError;
    }
    return {
      envName,
      stgNum,
      sysName,
      sbsName,
      typeName,
      elmName,
    };
  };
  const validateValue = (
    value: string | undefined,
    partName: string | undefined
  ): Result<string> => {
    const onlySymbolsUpToLengthEight = '^\\w{1,8}$';
    if (value && value.match(onlySymbolsUpToLengthEight)) {
      return value;
    }
    return new Error(
      `${partName} is incorrect, should be defined and contain up to 8 symbols.`
    );
  };

  const validateEndevorStage = (
    stage: string | undefined
  ): Result<'1' | '2'> => {
    if (stage === '1' || stage === '2') {
      return stage;
    }
    return new Error('Stage number is incorrect, should be only "1" or "2".');
  };

  const prefilledValue = [
    defaultValue.environment ?? '_ENV_',
    defaultValue.stageNumber ?? '_STGNUM_',
    defaultValue.system ?? '_SYS_',
    defaultValue.subsystem ?? '_SUBSYS_',
    defaultValue.type ?? '_TYPE_',
    defaultValue.elmName,
  ].join(pathDelimiter);

  const rawEndevorPath = await showInputBox({
    prompt: 'Enter the Endevor path where the element will be uploaded.',
    placeHolder: prettyPartNames,
    value: prefilledValue,
    validateInput: (value) => {
      const uploadPath = buildUploadPath(value.split(pathDelimiter));
      if (isError(uploadPath)) {
        const validationError = uploadPath;
        return validationError.message;
      }
      return undefined;
    },
  });
  if (operationIsCancelled(rawEndevorPath)) {
    logger.trace('No upload location for element was provided.');
    logger.trace('Operation cancelled.');
    return undefined;
  }
  const uploadPath = buildUploadPath(rawEndevorPath.split(pathDelimiter));
  if (isError(uploadPath)) {
    const validationError = uploadPath;
    logger.error(
      'Endevor path is incorrect.',
      `Endevor path parsing error: ${validationError.message}.`
    );
    return undefined;
  }
  return uploadPath;
};

const operationIsCancelled = <T>(
  value: T | undefined
): value is OperationCancelled => {
  return value === undefined;
};
