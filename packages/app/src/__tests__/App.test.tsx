import { render } from '@testing-library/react';
import App from '../App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response)
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });
});
