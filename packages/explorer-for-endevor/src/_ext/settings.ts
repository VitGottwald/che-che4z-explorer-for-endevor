import * as t from 'io-ts';

export type LocationConfig = t.TypeOf<typeof LocationConfig>;
export type LocationConfigs = t.TypeOf<typeof LocationConfigs>;
export type QuickEditConfig = t.TypeOf<typeof QuickEditConfig>;

export const LocationConfig = t.type({
  service: t.string,
  elementLocations: t.array(t.string),
});
export const LocationConfigs = t.array(LocationConfig);
export const QuickEditConfig = t.string;
