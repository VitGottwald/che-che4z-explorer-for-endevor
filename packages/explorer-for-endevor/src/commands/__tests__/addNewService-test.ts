import { addNewService } from '../addNewService';
import * as settings from '../../settings/settings';
import * as services from '../../services/services';
import * as userDialogs from '../../dialogs/locations/endevorServiceDialogs';
import { EndevorService } from '@local/endevor/_doc/Endevor';
import { CredentialType } from '@local/endevor/_doc/Credential';

jest.mock('vscode', () => ({}), { virtual: true });
jest.mock(
  '../../globals',
  () => ({
    logger: {
      trace: jest.fn(),
    },
  }),
  { virtual: true }
);

const anyElementLocations: string[] = [];

describe('AddNewService command workflow', () => {
  beforeEach(() => {
    jest
      .spyOn(settings, 'addService')
      .mockImplementation(() => Promise.resolve(undefined));
    jest
      .spyOn(services, 'createEndevorService')
      .mockImplementation(() => Promise.resolve(undefined));
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should create a new endevor service', async () => {
    // arrange
    const serviceToCreate = 'some_name';
    const serviceValueToCreate: EndevorService = {
      location: {
        protocol: 'http',
        hostname: 'localhost',
        port: 8080,
        basePath: 'some',
      },
      credential: {
        type: CredentialType.BASE,
        user: 'some',
        password: 'some',
      },
      rejectUnauthorized: true,
    };
    jest.spyOn(settings, 'getLocations').mockImplementation(() => []);
    jest
      .spyOn(services, 'getEndevorServiceNames')
      .mockImplementation(() => Promise.resolve([serviceToCreate]));
    jest.spyOn(userDialogs, 'askForServiceOrCreateNew').mockImplementation(() =>
      Promise.resolve({
        name: serviceToCreate,
        value: serviceValueToCreate,
      })
    );
    // act
    await addNewService();
    // assert
    expect(settings.addService).toHaveBeenCalledWith(serviceToCreate);
    expect(services.createEndevorService).toHaveBeenCalledWith(
      serviceToCreate,
      serviceValueToCreate
    );
  });
  it('should pick up existing endevor service', async () => {
    // arrange
    const serviceNameToPickUp = 'some_name';
    jest.spyOn(settings, 'getLocations').mockImplementation(() => [
      {
        service: serviceNameToPickUp,
        elementLocations: anyElementLocations,
      },
    ]);
    jest
      .spyOn(services, 'getEndevorServiceNames')
      .mockImplementation(() => Promise.resolve([]));
    jest
      .spyOn(userDialogs, 'askForServiceOrCreateNew')
      .mockImplementation(() => Promise.resolve(serviceNameToPickUp));
    // act
    await addNewService();
    // assert
    expect(settings.addService).toHaveBeenCalledWith(serviceNameToPickUp);
    expect(services.createEndevorService).not.toHaveBeenCalled();
  });
  it('should cancel the execution', async () => {
    // arrange
    jest.spyOn(settings, 'getLocations').mockImplementation(() => []);
    jest
      .spyOn(services, 'getEndevorServiceNames')
      .mockImplementation(() => Promise.resolve([]));
    jest
      .spyOn(userDialogs, 'askForServiceOrCreateNew')
      .mockImplementation(() => Promise.resolve(undefined));
    // act
    await addNewService();
    // assert
    expect(settings.addService).not.toHaveBeenCalled();
    expect(services.createEndevorService).not.toHaveBeenCalled();
  });
});
