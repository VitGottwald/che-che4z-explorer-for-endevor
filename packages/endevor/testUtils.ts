import { MockedEndpoint, Mockttp } from 'mockttp';
import { UnreachableCaseError } from './typeHelpers';
import MockRuleBuilder from 'mockttp/dist/rules/mock-rule-builder';
import { MockRequest, MockResponse } from '@local/endevor/_doc/MockServer';

// Test utilities

export const mockEndpoint = <T, U>(
  req: MockRequest<T>,
  res: MockResponse<U>
) => (mockServer: Mockttp): Promise<MockedEndpoint> => {
  const mockRuleBuilder = createMockBuilder(mockServer, req.path, req.method);
  if (req.query) mockRuleBuilder.withExactQuery(req.query);
  return mockRuleBuilder
    .withHeaders(req.headers)
    .thenReply(
      res.status,
      res.statusMessage,
      typeof res.data == 'string' ? res.data : JSON.stringify(res.data),
      res.headers
    );
};

const createMockBuilder = (
  mockServer: Mockttp,
  absoluteUri: string,
  method: 'GET' | 'PUT' | 'POST'
): MockRuleBuilder => {
  switch (method) {
    case 'GET':
      return mockServer.get(absoluteUri);
    case 'PUT':
      return mockServer.put(absoluteUri);
    case 'POST':
      return mockServer.post(absoluteUri);
    default:
      throw new UnreachableCaseError(method);
  }
};
