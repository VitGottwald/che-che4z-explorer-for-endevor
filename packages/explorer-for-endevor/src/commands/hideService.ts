import { logger } from '../globals';
import { removeService } from '../settings/settings';
import { ServerNode } from '../_doc/ElementTree';

export const hideService = async ({ name }: ServerNode): Promise<void> => {
  logger.trace(`Remove Profile called for: ${name}`);
  try {
    await removeService(name);
    logger.trace(`Service profile: ${name} was removed from settings`);
  } catch (error) {
    logger.error(
      `Profile with name: ${name} was not removed from settings`,
      `Service profile: ${name} was not removed from settings because of: ${error}`
    );
  }
};
