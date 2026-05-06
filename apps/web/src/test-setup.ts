import '@testing-library/jest-dom';

// cmdk (Command primitive) uses ResizeObserver and scrollIntoView internally;
// jsdom doesn't include either.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = function () {};
