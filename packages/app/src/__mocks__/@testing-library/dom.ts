// Mock @testing-library/dom to provide required functions and objects
export const configure = jest.fn(() => {
  // no-op
})

export function getConfig() {
  return {
    testIdAttribute: 'data-testid',
  }
}

export const cleanup = jest.fn(() => {
  // no-op
})

const fireEventImpl = jest.fn(() => {
  // no-op
})

export const fireEvent = Object.assign(fireEventImpl, {
  click: jest.fn(),
  change: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
  submit: jest.fn(),
  keyDown: jest.fn(),
  keyUp: jest.fn(),
  keyPress: jest.fn(),
  input: jest.fn(),
  paste: jest.fn(),
  copy: jest.fn(),
  cut: jest.fn(),
  mouseDown: jest.fn(),
  mouseUp: jest.fn(),
  mouseEnter: jest.fn(),
  mouseLeave: jest.fn(),
  mouseOver: jest.fn(),
  mouseOut: jest.fn(),
  pointerDown: jest.fn(),
  pointerUp: jest.fn(),
  pointerEnter: jest.fn(),
  pointerLeave: jest.fn(),
  pointerOver: jest.fn(),
  pointerOut: jest.fn(),
  touchStart: jest.fn(),
  touchEnd: jest.fn(),
  touchMove: jest.fn(),
  drag: jest.fn(),
  drop: jest.fn(),
  doubleClick: jest.fn(),
  error: jest.fn(),
  load: jest.fn(),
  scroll: jest.fn(),
  select: jest.fn(),
  invalid: jest.fn(),
  abort: jest.fn(),
})

export const queries = {}
export const waitFor = jest.fn((callback) => {
  try {
    return Promise.resolve(callback())
  } catch (e) {
    return Promise.reject(e)
  }
})
export const screen = {}
