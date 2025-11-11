// src/mocks/browser.js
// Sets up the MSW worker using the handlers defined in handlers.js

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// This worker intercepts network requests when mock mode is enabled
export const worker = setupWorker(...handlers);
