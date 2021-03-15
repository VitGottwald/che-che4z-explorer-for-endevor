import { assert } from 'chai';
import { ENDEVOR_CONFIGURATION, LOCATIONS_SETTINGS } from '../../constants';
import {
  getEndevorConfigurationValue,
  updateGlobalEndevorConfiguration,
} from '@local/vscode-wrapper/vscode-wrapper';
import { LocationConfig } from '../../_doc/settings';
import {
  addElementLocation,
  addService,
  getLocations,
  removeElementLocation,
  removeService,
} from '../settings';

describe('location configs handling workflow in settings', () => {
  let beforeTestsSettingsValue: ReadonlyArray<LocationConfig>;
  beforeEach(async () => {
    const emptyValue: LocationConfig[] = [];
    beforeTestsSettingsValue = getEndevorConfigurationValue(
      ENDEVOR_CONFIGURATION
    )(LOCATIONS_SETTINGS, emptyValue);
    await updateGlobalEndevorConfiguration(ENDEVOR_CONFIGURATION)(
      LOCATIONS_SETTINGS,
      emptyValue
    );
  });
  afterEach(async () => {
    await updateGlobalEndevorConfiguration(ENDEVOR_CONFIGURATION)(
      LOCATIONS_SETTINGS,
      beforeTestsSettingsValue
    );
  });
  it('should add service name', async () => {
    // arrange
    const service = 'test';
    // act
    await addService(service);
    // assert
    assert.isDefined(findServiceFromSettingsByName(service));

    await removeService(service);
    assert.isUndefined(findServiceFromSettingsByName(service));
  });

  const findServiceFromSettingsByName = (
    name: string
  ): LocationConfig | undefined => {
    return getLocations().find((location) => location.service === name);
  };

  it('should add element location for service', async () => {
    // arrange
    const service = 'service';
    const elementLocation = 'element-location';
    // act
    await addElementLocation(elementLocation, service);
    // assert
    assert.isDefined(
      findElementLocationFromService(
        elementLocation,
        findServiceFromSettingsByName(service)
      )
    );

    await removeElementLocation(elementLocation, service);
    assert.isUndefined(
      findElementLocationFromService(
        elementLocation,
        findServiceFromSettingsByName(service)
      )
    );
  });

  const findElementLocationFromService = (
    elementLocationToFind: string,
    endevorService: LocationConfig | undefined
  ): string | undefined => {
    return endevorService?.elementLocations.find(
      (location) => location === elementLocationToFind
    );
  };
});
