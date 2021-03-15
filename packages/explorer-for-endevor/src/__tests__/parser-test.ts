import { parseToType } from '@local/type-parser/parser';
import { LocationConfig, LocationConfigs } from '../_ext/settings';

describe('parseToType location configs', () => {
  it('should parse proper location config structure', () => {
    // arrange
    const locations: LocationConfig[] = [
      {
        service: 'some_name',
        elementLocations: ['some_location'],
      },
    ];
    // act
    const actualLocations = parseToType(LocationConfigs, locations);
    // assert
    expect(actualLocations).toEqual(locations);
  });
  it('should report for missed service name', () => {
    // arrange
    const locationsWithoutService = [
      {
        elementLocations: ['some_location'],
      },
    ];
    // act && assert
    expect(() => parseToType(LocationConfigs, locationsWithoutService)).toThrow(
      'Invalid value undefined supplied to : ' +
        'Array<{ service: string, elementLocations: Array<string> }>/0:' +
        ' { service: string, elementLocations: Array<string> }/service: string'
    );
  });
  it('should report for missed element location names', () => {
    // arrange
    const locationsWithoutElementLocations = [
      {
        service: 'some_name',
      },
    ];
    // act && assert
    expect(() =>
      parseToType(LocationConfigs, locationsWithoutElementLocations)
    ).toThrow(
      'Invalid value undefined supplied to : ' +
        'Array<{ service: string, elementLocations: Array<string> }>/0:' +
        ' { service: string, elementLocations: Array<string> }/elementLocations: Array<string>'
    );
  });
});
