import { logger } from './globals';
import * as endevor from '@local/endevor/endevor';

export const getInstanceNames = endevor.getInstanceNames(logger);
export const searchForElements = endevor.searchForElements(logger);
export const viewElement = endevor.viewElement(logger);
export const retrieveElement = endevor.retrieveElement(logger);
export const retrieveElementWithDependencies = endevor.retrieveElementWithDependencies(
  logger
);
export const retrieveElementWithFingerprint = endevor.retrieveElementWithFingerprint(
  logger
);
export const printElement = endevor.printElement(logger);
export const validateCredential = endevor.validateCredential(logger);
export const updateElement = endevor.updateElement(logger);
