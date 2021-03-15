// eventually replace this with Request and Response format of `fetch` API
export interface MockRequest<T> {
  method: 'GET' | 'PUT' | 'POST';
  path: string;
  query?: string;
  headers: {
    [key: string]: string;
  };
  body: T;
}
export interface MockResponse<T> {
  status: number;
  statusMessage: string;
  headers: {
    [key: string]: string;
  };
  data: T;
}
