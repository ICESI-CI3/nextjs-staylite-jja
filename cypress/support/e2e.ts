// cypress/support/e2e.ts
// ***********************************************************
// This file is processed and loaded automatically before test files
// ***********************************************************

// Import commands
import './commands';

// Hide fetch/XHR requests in command log (optional)
const app = window.top;
if (!app?.document.head?.querySelector('[data-hide-command-log-request]')) {
  const style = app?.document.createElement('style');
  if (style) {
    style.innerHTML =
      '.command-name-request, .command-name-xhr { display: none }';
    style.setAttribute('data-hide-command-log-request', '');
    app?.document.head?.appendChild(style);
  }
}

// Global before hook
beforeEach(() => {
  // Clear storage before each test
  cy.clearAllStorage();
  
  // Set viewport
  cy.viewport(1280, 720);
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // You can customize this to only ignore specific errors
  
  // Ignore Next.js hydration errors
  if (err.message.includes('Hydration')) {
    return false;
  }
  
  // Ignore ResizeObserver errors
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  
  // Ignore Zustand persistence errors during tests
  if (err.message.includes('localStorage') || err.message.includes('sessionStorage')) {
    return false;
  }
  
  // Log other errors but don't fail
  console.error('Uncaught exception:', err);
  
  // Fail the test for other errors
  return true;
});

// Add custom log
Cypress.Commands.overwrite('log', (originalFn, message, ...args) => {
  // Add timestamp to logs
  const timestamp = new Date().toISOString();
  return originalFn(`[${timestamp}] ${message}`, ...args);
});