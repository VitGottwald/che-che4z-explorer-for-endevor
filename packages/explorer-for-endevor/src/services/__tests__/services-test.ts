import { CredentialType } from '@local/endevor/_doc/Credential';
import { EndevorService } from '@local/endevor/_doc/Endevor';
import { EndevorServiceProfile } from '@local/profiles/_ext/Profile';
import path = require('path');
import { ENDEVOR_V2_BASE_PATH } from '../../constants';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

jest.mock('@zowe/imperative/lib/console/src/Console'); // disable imperative logging
jest.mock('vscode', () => ({}), { virtual: true });

const setupGlobals = (profilesDir: string) => {
  jest.resetModules();
  jest.doMock('@local/profiles/globals', () => ({
    __esModule: true,
    getProfilesDir: () => path.join(__dirname, profilesDir),
  }));
};

jest.mock(
  '../../globals',
  () => ({
    logger: {
      trace: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  }),
  { virtual: true }
);

describe('Endevor services fetching', () => {
  // please, pay attention, these values can be used as defaults
  const defaultBasePath = ENDEVOR_V2_BASE_PATH;
  const defaultProtocol = 'http';
  const defaultRejectUnauthorized = true;

  it('should return list of services', async () => {
    // arrange
    setupGlobals('./__fixtures__/get-only-endevor-profiles');
    const services = await import('../services');
    // act
    const actualServices = await services.getEndevorServiceNames();
    // assert
    const expectedServices = ['endevor1', 'endevor2', 'endevor3'];
    expect(actualServices).toEqual(expectedServices);
  });

  it('should return empty list if no service existed', async () => {
    // arrange
    setupGlobals('./__fixtures__/no-default-profiles');
    const services = await import('../services');
    // act
    const actualServices = await services.getEndevorServiceNames();
    // assert
    expect(actualServices).toEqual([]);
  });

  it('should return empty list if something went wrong', async () => {
    // arrange
    setupGlobals('./__fixtures__/missing-profiles-folder');
    const services = await import('../services');
    // act
    const actualServices = await services.getEndevorServiceNames();
    // assert
    expect(actualServices).toEqual([]);
  });

  it('should return service', async () => {
    // arrange
    setupGlobals('./__fixtures__/base-profile-no-host');
    const services = await import('../services');
    // act
    const actualService = await services.getEndevorServiceByName('endevor1');
    // assert
    expect(actualService).toEqual({
      location: {
        hostname: 'endevor1.example.com',
        port: 12345,
        protocol: 'http',
        basePath: defaultBasePath,
      },
      credential: {
        type: CredentialType.BASE,
        user: 'endevorUser1',
        password: 'endevorPassword1',
      },
      rejectUnauthorized: false,
    });
  });

  it('should return service with location from default base profile', async () => {
    // arrange
    setupGlobals('./__fixtures__/endevor-profile-no-location');
    const services = await import('../services');
    // act
    const actualService = await services.getEndevorServiceByName('endevor1');
    // assert
    expect(actualService).toEqual({
      location: {
        hostname: 'baseHost',
        port: 123,
        protocol: defaultProtocol,
        basePath: defaultBasePath,
      },
      credential: {
        type: CredentialType.BASE,
        user: 'user',
        password: 'pass',
      },
      rejectUnauthorized: defaultRejectUnauthorized,
    });
  });

  it('should return service with credential from default base profile', async () => {
    // arrange
    setupGlobals('./__fixtures__/endevor-profile-no-credential');
    const services = await import('../services');
    // act
    const actualService = await services.getEndevorServiceByName('endevor1');
    // assert
    expect(actualService).toEqual({
      location: {
        hostname: 'localhost',
        port: 123,
        protocol: 'http',
        basePath: defaultBasePath,
      },
      credential: {
        type: CredentialType.BASE,
        user: 'baseUser',
        password: 'basePass',
      },
      rejectUnauthorized: false,
    });
  });

  it('should return undefined if no location was found in service and default base profiles', async () => {
    // arrange
    setupGlobals('./__fixtures__/endevor-and-base-profiles-no-location');
    const services = await import('../services');
    // act
    const actualService = await services.getEndevorServiceByName('endevor1');
    // assert
    expect(actualService).toBeUndefined();
  });

  it('should return undefined if no credential was found in service and default base profiles', async () => {
    // arrange
    setupGlobals('./__fixtures__/endevor-and-base-profiles-no-credential');
    const services = await import('../services');
    // act
    const actualService = await services.getEndevorServiceByName('endevor1');
    // assert
    expect(actualService).toBeUndefined();
  });
});

describe('Create endevor service', () => {
  let services: typeof import('../services');
  const profileRootDir = './__fixtures__/create-endevor-profile';
  beforeAll(async () => {
    setupGlobals(profileRootDir);
    services = await import('../services');
  });

  const newServiceName = 'new-endevor-profile';
  const newServicePath = path.join(
    __dirname,
    profileRootDir,
    'endevor',
    `${newServiceName}.yaml`
  );
  beforeAll(async () => {
    try {
      // try deleting a file in case previous run failed
      await fs.promises.unlink(newServicePath);
    } catch (_e) {
      // do nothing if the file did not exist
    }
  });
  afterAll(async () => {
    // delete the new profile after test
    await fs.promises.unlink(newServicePath);
  });

  it('should create a new yaml file on disk with service content', async () => {
    // arrange
    const newService: EndevorService = {
      credential: {
        type: CredentialType.BASE,
        user: 'new-endevor-user',
        password: 'new-endevor-password',
      },
      location: {
        hostname: 'localhost',
        protocol: 'http',
        port: 8080,
        basePath: '/some',
      },
      rejectUnauthorized: true,
    };
    // act
    await services.createEndevorService(newServiceName, newService);
    // assert
    const serviceOnDisk = await fs.promises.readFile(newServicePath, 'utf-8');
    const decodedService = yaml.safeLoad(serviceOnDisk);
    expect(decodedService).toEqual({
      user: 'new-endevor-user',
      password: 'new-endevor-password',
      host: 'localhost',
      protocol: 'http',
      port: 8080,
      basePath: '/some',
      rejectUnauthorized: true,
    });
  });
  it('should fail to overwrite an existing service', async () => {
    // arrange
    const existingServiceName = 'existing-endevor-profile';
    const existingServicePath = path.join(
      __dirname,
      profileRootDir,
      'endevor',
      `${existingServiceName}.yaml`
    );
    // act
    // - try to overwrite existing profile on disk with new content
    expect(
      await services.createEndevorService(existingServiceName, {
        credential: {
          type: CredentialType.BASE,
          user: 'new-endevor-user',
          password: 'new-endevor-password',
        },
        location: {
          hostname: 'localhost',
          protocol: 'http',
          port: 8080,
          basePath: '/some',
        },
        rejectUnauthorized: true,
      })
    ).toBe(undefined);
    // assert
    const serviceOnDisk = await fs.promises.readFile(
      existingServicePath,
      'utf-8'
    );
    const decodedService = yaml.safeLoad(serviceOnDisk);
    const existingService: EndevorServiceProfile = {
      user: 'existing-endevor-user',
      password: 'existing-endevor-password',
    };
    expect(decodedService).toEqual(existingService);
  });
});
