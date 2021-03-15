import { CliProfileManager, IProfileLoaded } from '@zowe/imperative';
import {
  BaseProfile,
  EndevorLocationProfile,
  EndevorServiceProfile,
  Profile,
  ProfileTypes,
} from './_ext/Profile';

import { isDefined } from './utils';
import { parseToType } from '@local/type-parser/parser';
import { getProfilesDir } from './globals';
import { Logger } from '@local/extension/_doc/Logger';

const getProfileManagerFromDir = (logger: Logger) => (
  profileRootDirectory: string
) => (profileType: ProfileTypes): CliProfileManager | undefined => {
  try {
    const profileManager = new CliProfileManager({
      profileRootDirectory,
      type: profileType,
    });
    logger.trace(`Profile Manager created - ${profileType.toUpperCase()}`);
    return profileManager;
  } catch (error) {
    logger.error(
      `Failed to create Profile Manager - ${profileType.toUpperCase()}`,
      error.message
    );
    return undefined;
  }
};
const getProfileManager = (logger: Logger) =>
  getProfileManagerFromDir(logger)(getProfilesDir());

const emptyBaseProfile: BaseProfile = {};

export const getDefaultBaseProfile = (logger: Logger) => async (): Promise<
  BaseProfile
> => {
  const profileManager = getProfileManager(logger)(ProfileTypes.BASE);
  if (!profileManager) {
    return emptyBaseProfile;
  }
  let baseProfile;
  try {
    baseProfile = (await profileManager.load({ loadDefault: true })).profile;
  } catch (error) {
    logger.trace(`There is no default base profile`);
    return emptyBaseProfile;
  }
  try {
    return parseToType(BaseProfile, baseProfile);
  } catch (error) {
    logger.trace(
      `Default base profile validation error: ${error}, actual value: ${JSON.stringify(
        baseProfile
      )}`
    );
    return emptyBaseProfile;
  }
};

interface createProfile {
  (type: ProfileTypes.ENDEVOR): (
    logger: Logger
  ) => (name: string, profile: EndevorServiceProfile) => Promise<void>;
  (type: ProfileTypes.ENDEVOR_LOCATION): (
    logger: Logger
  ) => (name: string, profile: EndevorLocationProfile) => Promise<void>;
}
export const createProfile: createProfile = (type: ProfileTypes) => (
  logger: Logger
) => async (name: string, profile: Profile): Promise<void> => {
  const profileManager = getProfileManager(logger)(type);
  if (!profileManager) {
    return;
  }
  try {
    await profileManager.save({
      name,
      profile,
      type,
    });
    logger.trace(`Profile with name: ${name} and type: ${type} was created`);
  } catch (error) {
    logger.error(
      `Something went wrong with profile: ${name} creation`,
      `Profile manager response for saving profile ${name} is: ${error}`
    );
    return;
  }
};

export const getEndevorServiceNames = (logger: Logger) => async (): Promise<
  string[]
> => {
  return (await getProfilesByType(logger)(ProfileTypes.ENDEVOR))
    .map((profileResponse) => profileResponse.name)
    .filter(isDefined);
};

const emptyServiceProfile: EndevorServiceProfile = {};

export const getServiceProfileByName = (logger: Logger) => async (
  name: string
): Promise<EndevorServiceProfile> => {
  const profileManager = getProfileManager(logger)(ProfileTypes.ENDEVOR);
  if (!profileManager) {
    return emptyServiceProfile;
  }
  let serviceProfile;
  try {
    serviceProfile = (await profileManager.load({ name })).profile;
  } catch (error) {
    logger.error(
      `There is no such endevor profile with name: ${name}`,
      `Profile manager response for fetching endevor profile with name: ${name} is: ${error}`
    );
    return emptyServiceProfile;
  }
  try {
    return parseToType(EndevorServiceProfile, serviceProfile);
  } catch (error) {
    logger.error(
      `Endevor profile with name: ${name} is invalid and cannot be used`,
      `Endevor profile validation error: ${error}, actual value: ${JSON.stringify(
        serviceProfile
      )}`
    );
    return emptyServiceProfile;
  }
};

export const getProfilesByType = (logger: Logger) => async (
  type: ProfileTypes
): Promise<IProfileLoaded[]> => {
  const profileManager = getProfileManager(logger)(type);
  if (!profileManager) {
    return [];
  }
  try {
    return profileManager.loadAll({
      typeOnly: true,
    });
  } catch (error) {
    logger.error(
      `Something went wrong with profiles with type: ${type} fetching`,
      `Profile manager response for fetching profiles with type: ${type} is: ${error}`
    );
    return [];
  }
};

const emptyLocationProfile: EndevorLocationProfile = {};

export const getLocationProfileByName = (logger: Logger) => async (
  name: string
): Promise<EndevorLocationProfile> => {
  const profileManager = getProfileManager(logger)(
    ProfileTypes.ENDEVOR_LOCATION
  );
  if (!profileManager) {
    return emptyLocationProfile;
  }
  let locationProfile;
  try {
    locationProfile = (await profileManager.load({ name })).profile;
  } catch (error) {
    logger.error(
      `There is no such profile with name: ${name}`,
      `Profile manager response for fetching location profile with name: ${name} is: ${error}`
    );
    return emptyLocationProfile;
  }
  try {
    return parseToType(EndevorLocationProfile, locationProfile);
  } catch (error) {
    logger.error(
      `Location profile with name: ${name} is invalid and cannot be used`,
      `Location profile validation error: ${error}, actual value: ${JSON.stringify(
        locationProfile
      )}`
    );
    return emptyLocationProfile;
  }
};
