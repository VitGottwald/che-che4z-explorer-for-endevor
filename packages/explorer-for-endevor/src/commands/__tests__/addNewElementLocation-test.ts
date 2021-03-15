import { addNewElementLocation } from '../addNewElementLocation';
import * as settings from '../../settings/settings';
import * as services from '../../services/services';
import * as elementLocations from '../../element-locations/elementLocations';
import * as userDialogs from '../../dialogs/locations/endevorElementLocationDialogs';
import * as endevor from '../../endevor';
import { EndevorUrl } from '@local/endevor/_doc/Endevor';
import {
  CredentialType,
  EndevorCredential,
} from '@local/endevor/_doc/Credential';
import { ServerNode } from '../../_doc/ElementTree';

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

describe('Add new element location workflow', () => {
  const serviceName = 'service';

  const serverNode: ServerNode = {
    type: 'SERVER',
    name: serviceName,
    children: [],
  };

  const location: EndevorUrl = {
    protocol: 'http',
    hostname: 'localhost',
    port: 8080,
    basePath: 'some',
  };
  const credential: EndevorCredential = {
    type: CredentialType.BASE,
    user: 'user',
    password: 'password',
  };
  const rejectUnauthorized = true;
  const instances = ['one', 'two'];

  beforeEach(() => {
    jest
      .spyOn(settings, 'addElementLocation')
      .mockImplementation(() => Promise.resolve(undefined));
    jest
      .spyOn(elementLocations, 'createEndevorElementLocation')
      .mockImplementation(() => Promise.resolve(undefined));
    jest
      .spyOn(services, 'getEndevorServiceByName')
      .mockImplementation(() =>
        Promise.resolve({ location, credential, rejectUnauthorized })
      );
    jest
      .spyOn(endevor, 'getInstanceNames')
      .mockImplementation(() => Promise.resolve(instances));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create new element location', async () => {
    // arrange
    const elementLocationNameToCreate = 'some_name';
    const elementLocationValueToCreate = { instance: 'NDVRCNFG' };
    jest.spyOn(settings, 'getLocations').mockImplementation(() => []);
    jest
      .spyOn(elementLocations, 'getElementLocationNames')
      .mockImplementation(() => Promise.resolve([elementLocationNameToCreate]));
    jest
      .spyOn(userDialogs, 'askForElementLocationOrCreateNew')
      .mockImplementation(() =>
        Promise.resolve({
          name: elementLocationNameToCreate,
          value: elementLocationValueToCreate,
        })
      );
    // act
    await addNewElementLocation(serverNode);
    // assert
    expect(settings.addElementLocation).toHaveBeenCalledWith(
      elementLocationNameToCreate,
      serviceName
    );
    expect(elementLocations.createEndevorElementLocation).toHaveBeenCalledWith(
      elementLocationNameToCreate,
      elementLocationValueToCreate
    );
  });
  it('should pick up existing element location', async () => {
    // arrange
    const existingLocationName = 'existing_location';
    jest.spyOn(settings, 'getLocations').mockImplementation(() => [
      {
        service: serviceName,
        elementLocations: [existingLocationName],
      },
    ]);
    const elementLocationToPickUp = 'not_used_location';
    jest
      .spyOn(elementLocations, 'getElementLocationNames')
      .mockImplementation(() =>
        Promise.resolve([elementLocationToPickUp, existingLocationName])
      );
    jest
      .spyOn(userDialogs, 'askForElementLocationOrCreateNew')
      .mockImplementation(() => Promise.resolve(elementLocationToPickUp));
    // act
    await addNewElementLocation(serverNode);
    // assert
    expect(userDialogs.askForElementLocationOrCreateNew).toHaveBeenCalledWith(
      [elementLocationToPickUp],
      expect.any(Function)
    );
    expect(settings.addElementLocation).toHaveBeenCalledWith(
      elementLocationToPickUp,
      serviceName
    );
    expect(
      elementLocations.createEndevorElementLocation
    ).not.toHaveBeenCalled();
  });
  it('should cancel the execution', async () => {
    // arrange
    jest.spyOn(settings, 'getLocations').mockImplementation(() => []);
    jest
      .spyOn(elementLocations, 'getElementLocationNames')
      .mockImplementation(() => Promise.resolve([]));
    jest
      .spyOn(userDialogs, 'askForElementLocationOrCreateNew')
      .mockImplementation(() => Promise.resolve(undefined));
    // act
    await addNewElementLocation(serverNode);
    // assert
    expect(settings.addElementLocation).not.toHaveBeenCalled();
    expect(
      elementLocations.createEndevorElementLocation
    ).not.toHaveBeenCalled();
  });
});
