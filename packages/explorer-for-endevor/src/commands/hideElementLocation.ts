import { logger } from '../globals';
import { removeElementLocation } from '../settings/settings';
import { LocationNode } from '../_doc/ElementTree';

export const hideElementLocation = async ({
  name,
  serviceName,
}: LocationNode): Promise<void> => {
  logger.trace(
    `Remove Location Profile called for location: ${name} and service: ${serviceName}`
  );
  try {
    await removeElementLocation(name, serviceName);
    logger.trace(`Location profile: ${name} was removed from settings`);
  } catch (error) {
    logger.error(
      `Location profile with name: ${name} was not removed from settings`,
      `Location profile: ${name} was not removed from settings because of: ${error}`
    );
  }
};
