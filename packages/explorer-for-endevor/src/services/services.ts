import {
  CredentialType,
  EndevorCredential,
} from '@local/endevor/_doc/Credential';
import {
  EndevorService,
  EndevorServiceProtocol,
  EndevorUrl,
} from '@local/endevor/_doc/Endevor';
import {
  createProfile,
  getDefaultBaseProfile,
  getProfilesByType,
  getServiceProfileByName,
} from '@local/profiles/profiles';
import {
  BaseProfile,
  EndevorServiceProfile,
  ProfileTypes,
} from '@local/profiles/_ext/Profile';
import { ENDEVOR_V2_BASE_PATH } from '../constants';
import { logger } from '../globals';
import { isDefined } from '../utils';

export const createEndevorService = async (
  name: string,
  endevorService: EndevorService
): Promise<void> => {
  if (endevorService.credential.type === CredentialType.BASE) {
    const serviceProfile = {
      host: endevorService.location.hostname,
      port: endevorService.location.port,
      protocol: endevorService.location.protocol,
      basePath: endevorService.location.basePath,
      user: endevorService.credential.user,
      password: endevorService.credential.password,
      rejectUnauthorized: endevorService.rejectUnauthorized,
    };
    await createProfile(ProfileTypes.ENDEVOR)(logger)(name, serviceProfile);
  } else {
    logger.error('Endevor profile with token credentials cannot be created');
  }
};

export const getEndevorServiceNames = async (): Promise<string[]> => {
  return (await getProfilesByType(logger)(ProfileTypes.ENDEVOR))
    .map((profileResponse) => profileResponse.name)
    .filter(isDefined);
};

export const getEndevorServiceByName = async (
  name: string
): Promise<EndevorService | undefined> => {
  const [defaultBaseProfile, serviceProfile] = await Promise.all([
    getDefaultBaseProfile(logger)(),
    getServiceProfileByName(logger)(name),
  ]);
  const credential = getEndevorCredentialFromProfiles(
    serviceProfile,
    defaultBaseProfile
  );
  if (!credential) {
    return undefined;
  }
  const location = getEndevorLocationFromProfiles(
    serviceProfile,
    defaultBaseProfile
  );
  if (!location) {
    return undefined;
  }
  const rejectUnauthorized = getRejectUnauthorizedFromProfile(serviceProfile);
  return {
    credential,
    location,
    rejectUnauthorized,
  };
};

const getEndevorCredentialFromProfiles = (
  serviceProfile: EndevorServiceProfile,
  baseProfile: BaseProfile
): EndevorCredential | undefined => {
  const user = serviceProfile.user || baseProfile.user;
  const password = serviceProfile.password || baseProfile.password;
  if (user && password) {
    return {
      type: CredentialType.BASE,
      user,
      password,
    };
  }
  const tokenType = baseProfile.tokenType;
  const tokenValue = baseProfile.tokenValue;
  if (tokenType && tokenValue) {
    return {
      type: CredentialType.TOKEN,
      tokenType,
      tokenValue,
    };
  }
  logger.error(
    `There is no valid credential in the Endevor profile and default base profile`,
    `Endevor profile or default base profile should contain credential, actual values: ${JSON.stringify(
      serviceProfile
    )} and ${JSON.stringify(baseProfile)}`
  );
  return undefined;
};

const getEndevorLocationFromProfiles = (
  serviceProfile: EndevorServiceProfile,
  defaultBaseProfile: BaseProfile
): EndevorUrl | undefined => {
  let protocol: EndevorServiceProtocol;
  if (!serviceProfile.protocol) {
    const defaultProtocol = 'http';
    protocol = defaultProtocol;
    logger.warn(
      `There is no valid protocol in the Endevor profile, default value: ${defaultProtocol} will be used instead`
    );
  } else {
    protocol = serviceProfile.protocol;
  }
  const hostname = serviceProfile.host || defaultBaseProfile.host;
  if (!hostname) {
    logger.error(
      `There is no hostname in the Endevor profile and default base profile`,
      `There is no hostname in the Endevor profile and default base profile, actual value: ${JSON.stringify(
        serviceProfile
      )}`
    );
    return undefined;
  }
  const port = serviceProfile.port || defaultBaseProfile.port;
  if (!port) {
    logger.error(
      `There is no port in the Endevor profile and default base profile`,
      `There is no port in the Endevor profile and default base profile, actual value: ${JSON.stringify(
        serviceProfile
      )}`
    );
    return undefined;
  }
  let basePath: string;
  if (!serviceProfile.basePath) {
    const defaultBasePath = ENDEVOR_V2_BASE_PATH;
    logger.warn(
      `There is no base path in the Endevor profile, default value: ${defaultBasePath} will be used instead`
    );
    basePath = defaultBasePath;
  } else {
    basePath = serviceProfile.basePath;
  }
  return {
    protocol,
    hostname,
    port,
    basePath,
  };
};

const getRejectUnauthorizedFromProfile = (
  serviceProfile: EndevorServiceProfile
): boolean => {
  const defaultValue = true;
  if (serviceProfile.rejectUnauthorized === undefined) {
    logger.warn(
      `There is no reject unauthorized specified in the Endevor profile, default value: ${defaultValue} will be used instead`
    );
    return defaultValue;
  }
  return serviceProfile.rejectUnauthorized;
};
