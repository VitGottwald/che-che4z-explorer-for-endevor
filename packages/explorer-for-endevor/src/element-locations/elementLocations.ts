import { EndevorElementLocation } from '@local/endevor/_doc/Endevor';
import {
  createProfile,
  getLocationProfileByName,
  getProfilesByType,
} from '@local/profiles/profiles';
import { isDefined } from '@local/profiles/utils';
import { ProfileTypes } from '@local/profiles/_ext/Profile';
import { logger } from '../globals';

export const createEndevorElementLocation = async (
  name: string,
  endevorElementLocation: EndevorElementLocation
): Promise<void> => {
  await createProfile(ProfileTypes.ENDEVOR_LOCATION)(logger)(
    name,
    endevorElementLocation
  );
};

export const getElementLocationNames = async (): Promise<string[]> => {
  return (await getProfilesByType(logger)(ProfileTypes.ENDEVOR_LOCATION))
    .map((profileResponse) => profileResponse.name)
    .filter(isDefined);
};

export const getElementLocationByName = async (
  name: string
): Promise<EndevorElementLocation | undefined> => {
  const locationProfile = await getLocationProfileByName(logger)(name);
  if (locationProfile.instance) {
    return {
      instance: locationProfile.instance,
      environment: locationProfile.environment,
      stageNumber: locationProfile.stageNumber,
      system: locationProfile.system,
      subsystem: locationProfile.subsystem,
      type: locationProfile.type,
      ccid: locationProfile.ccid,
      comment: locationProfile.comment,
    };
  }
  logger.error(
    `Location profile with ${name} should have instance specified`,
    `Element location with ${name} has no instance, actual value: ${JSON.stringify(
      locationProfile
    )}`
  );
  return undefined;
};
