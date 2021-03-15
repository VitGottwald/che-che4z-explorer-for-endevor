import { LocationConfig } from './settings';

export const enum Actions {
  DUMMY_NOOP = 'DUMMY/NOOP',
  ENDEVOR_CREDENTIAL_ADDED = 'CREDENTIAL/ADDED',
  LOCATION_CONFIG_CHANGED = 'LOCATIONS/CHANGED',
}

interface DummyAction {
  type: Actions.DUMMY_NOOP;
}

interface LocationConfigChanged {
  type: Actions.LOCATION_CONFIG_CHANGED;
  payload: ReadonlyArray<LocationConfig>;
}

export type Action = LocationConfigChanged | DummyAction;
