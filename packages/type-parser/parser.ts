import * as t from 'io-ts';
import { PathReporter } from 'io-ts/PathReporter';
import { fold } from 'fp-ts/lib/Either';

/**
 * Verifies that `input` is a valid `type`
 * @param type
 * @param input
 */
export const parseToType = <T, O, I>(type: t.Type<T, O, I>, input: I): T => {
  const result = type.decode(input);
  return fold<t.Errors, T, T>(
    (_errors) => {
      // validation failed, tell the user why `input` does not match `type`
      const messages = PathReporter.report(result);
      throw new Error(messages.join('\n'));
    },
    (value) => value
  )(result);
};
