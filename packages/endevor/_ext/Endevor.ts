import * as t from 'io-ts';
import { EndevorStageNumber } from '../_doc/Endevor';

// "What makes io-ts uniquely valuable is that it simultaneously defines a runtime validator and a static type."
// https://www.olioapps.com/blog/checking-types-real-world-typescript/

export type EndevorLocation = t.TypeOf<typeof EndevorLocation>;

export type EndevorRepository = t.TypeOf<typeof EndevorRepository>;
export type EndevorRepositories = t.TypeOf<typeof EndevorRepositories>;

export type EndevorElement = t.TypeOf<typeof EndevorElement>;
export type EndevorElements = t.TypeOf<typeof EndevorElements>;

export type EndevorElementDependency = t.TypeOf<
  typeof EndevorElementDependency
>;
export type EndevorElementDependencies = t.TypeOf<
  typeof EndevorElementDependencies
>;

export type DependentElement = t.TypeOf<typeof DependentElement>;

export const EndevorLocation = t.type({
  baseUrl: t.string,
  configuration: t.string,
});

export const EndevorRepository = t.type({
  name: t.string,
});
export const EndevorRepositories = t.array(EndevorRepository);

// TODO: remove this class after investigation
class EndevorStageNumberType extends t.Type<EndevorStageNumber> {
  constructor() {
    super(
      'EndevorStageNumber',
      (value): value is EndevorStageNumber => value === '1' || value === '2',
      (value, context) =>
        this.is(value) ? t.success(value) : t.failure(value, context),
      (value) => value
    );
  }
}

export const EndevorElement = t.type({
  envName: t.string,
  stgNum: new EndevorStageNumberType(),
  sysName: t.string,
  sbsName: t.string,
  typeName: t.string,
  elmName: t.string,
  fileExt: t.string,
});
export const EndevorElements = t.array(EndevorElement);

export const DependentElement = t.type({
  envName: t.string,
  stgNum: new EndevorStageNumberType(),
  sysName: t.string,
  sbsName: t.string,
  typeName: t.string,
  elmName: t.string,
});
export const EndevorElementDependency = t.type({
  components: t.array(DependentElement),
});
export const EndevorElementDependencies = t.array(EndevorElementDependency);
