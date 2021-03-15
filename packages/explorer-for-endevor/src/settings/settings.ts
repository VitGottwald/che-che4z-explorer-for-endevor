import {
  ENDEVOR_CONFIGURATION,
  LOCATIONS_SETTINGS,
  QUICK_EDIT_DOWNLOAD_FOLDER,
  QUICK_EDIT_DOWNLOAD_FOLDER_DEFAULT,
} from '../constants';
import { logger } from '../globals';
import { parseToType } from '@local/type-parser/parser';
import {
  getEndevorConfigurationValue,
  updateGlobalEndevorConfiguration,
} from '@local/vscode-wrapper/vscode-wrapper';
import * as vscode from 'vscode';
import { Action, Actions } from '../_doc/Actions';
import { LocationConfig } from '../_doc/settings';
import { LocationConfigs, QuickEditConfig } from '../_ext/settings';

export const getLocations = (): ReadonlyArray<LocationConfig> => {
  // please, pay attention: this call can be lazy
  const locations = getEndevorConfigurationValue(ENDEVOR_CONFIGURATION)(
    LOCATIONS_SETTINGS,
    []
  );
  return parseToType(LocationConfigs, locations);
};

export const getQuickEditLocation = (): string => {
  // please, pay attention: this call can be lazy
  const downloadPath = getEndevorConfigurationValue(ENDEVOR_CONFIGURATION)(
    QUICK_EDIT_DOWNLOAD_FOLDER,
    QUICK_EDIT_DOWNLOAD_FOLDER_DEFAULT
  );
  return parseToType(QuickEditConfig, downloadPath);
};

export const addService = (service: string): Promise<void> => {
  const updatedLocations = updateLocationsWithNewItem(getLocations(), {
    service,
    elementLocations: [],
  });
  return updateConfiguration(updatedLocations);
};

const updateLocationsWithNewItem = (
  locations: ReadonlyArray<LocationConfig>,
  updatedItem: LocationConfig
): ReadonlyArray<LocationConfig> => {
  const filteredLocations = locations.filter(
    (service) => service.service !== updatedItem.service
  );
  filteredLocations.push(updatedItem);
  return filteredLocations;
};

const updateConfiguration = (
  updatedLocations: ReadonlyArray<LocationConfig>
): Promise<void> => {
  logger.trace(
    `Update configuration called for "${ENDEVOR_CONFIGURATION}.${LOCATIONS_SETTINGS}" with value: ${JSON.stringify(
      updatedLocations,
      null,
      2
    )}`
  );
  return updateGlobalEndevorConfiguration(ENDEVOR_CONFIGURATION)(
    LOCATIONS_SETTINGS,
    updatedLocations
  );
};

export const addElementLocation = (
  elementLocation: string,
  service: string
) => {
  const allLocations = getLocations();
  const updatedElementLocations = [
    elementLocation,
    ...getElementLocationsForService(allLocations, service),
  ];
  return updateConfiguration(
    updateLocationsWithNewItem(allLocations, {
      service,
      elementLocations: updatedElementLocations,
    })
  );
};

const getElementLocationsForService = (
  locations: ReadonlyArray<LocationConfig>,
  serviceToFind: string
): ReadonlyArray<string> => {
  const foundService = locations.find(
    (location) => location.service === serviceToFind
  );
  return foundService ? foundService.elementLocations : [];
};

export const removeService = (service: string): Promise<void> => {
  const filteredLocations = getLocations().filter(
    (existingLocation) => existingLocation.service !== service
  );
  return updateConfiguration(filteredLocations);
};

export const removeElementLocation = (
  elementLocationToRemove: string,
  service: string
) => {
  const allLocations = getLocations();
  const filteredElementLocations = getElementLocationsForService(
    allLocations,
    service
  ).filter((elementLocation) => elementLocation !== elementLocationToRemove);
  return updateConfiguration(
    updateLocationsWithNewItem(allLocations, {
      service,
      elementLocations: filteredElementLocations,
    })
  );
};

const watch = (settingsKey: string) => (dispatch: (action: Action) => void) => {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(`${ENDEVOR_CONFIGURATION}.${settingsKey}`)) {
      dispatch({
        type: Actions.LOCATION_CONFIG_CHANGED,
        payload: getLocations(),
      });
    }
  });
};
const reducer = (
  locations: LocationConfig[],
  action: Action
): LocationConfig[] => {
  switch (action.type) {
    case Actions.LOCATION_CONFIG_CHANGED:
      return [...action.payload];
    default:
      return locations;
  }
};

export const watchForLocations = watch(LOCATIONS_SETTINGS);

// to be removed
const settingsStore: ReadonlyArray<LocationConfig> = [
  {
    service: 'PROF',
    elementLocations: ['LOC1', 'LOC2', 'LOC3'],
  },
];

export const dispatch = (action: Action): void => {
  const settings = reducer([...settingsStore], action);
  logger.trace(`Settings updated. Value: ${JSON.stringify(settings, null, 2)}`);
};
