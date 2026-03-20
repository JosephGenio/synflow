import App from '../App';

beforeEach(() => {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response)
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('App', () => {
  it('can be imported', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
