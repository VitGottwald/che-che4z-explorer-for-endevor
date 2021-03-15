import { parseToType } from '@local/type-parser/parser';
import {
  EndevorElement,
  EndevorElementDependency,
  EndevorRepositories,
} from '../_ext/Endevor';

describe('parseToType endevor repositories', () => {
  it('should parse proper repositories structure', () => {
    // arrange
    const repositories: EndevorRepositories = [
      {
        name: 'WEBSMFNO',
      },
    ];
    // act
    const actualEndevorRepositories = parseToType(
      EndevorRepositories,
      repositories
    );
    // assert
    expect(actualEndevorRepositories).toEqual(repositories);
  });
  it('should report for missed instance name', () => {
    // arrange
    const repositoriesWithoutInstanceName = [{}];
    // act && assert
    expect(() =>
      parseToType(EndevorRepositories, repositoriesWithoutInstanceName)
    ).toThrow(
      'Invalid value undefined supplied to : Array<{ name: string }>/0: { name: string }/name: string'
    );
  });
});

describe('parseToType endevor elements', () => {
  it('should parse for a proper element', () => {
    // arrange
    const element = {
      envName: 'env',
      stgNum: '1',
      sysName: 'sys',
      sbsName: 'sbs',
      typeName: 'type',
      elmName: 'element',
      fileExt: '.cbl',
    };
    // act
    const result = parseToType(EndevorElement, element);
    // assert
    expect(result).toEqual(element);
  });
  it('should report for missing property', () => {
    // arrange
    const incorrectElement = {
      // envName: 'env',
      stgNum: '1',
      sysName: 'sys',
      sbsName: 'sbs',
      typeName: 'type',
      elmName: 'element',
      fileExt: '.cbl',
    };
    // act && assert
    expect(() => parseToType(EndevorElement, incorrectElement)).toThrowError();
  });
});

describe('parseToType endevor element dependencies', () => {
  it('should parse for a proper dependency', () => {
    // arrange
    const dependency = {
      components: [
        {
          envName: 'env',
          stgNum: '1',
          sysName: 'sys',
          sbsName: 'sbs',
          typeName: 'type',
          elmName: 'element',
        },
      ],
    };
    // act
    const result = parseToType(EndevorElementDependency, dependency);
    // assert
    expect(result).toEqual(dependency);
  });
  it('should report for missing components', () => {
    // arrange
    const incorrectDependency = {};
    // act && assert
    expect(() =>
      parseToType(EndevorElementDependency, incorrectDependency)
    ).toThrowError();
  });
});
