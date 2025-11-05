// cypress/support/commands.ts
/// <reference types="cypress" />

// ***********************************************
// Custom commands for Cypress
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login
       * @example cy.login('user@email.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to get by data-testid
       * @example cy.getByTestId('submit-button')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to mock API response
       * @example cy.mockApiResponse('/api/lodgings', 'GET', { data: [] })
       */
      mockApiResponse(
        url: string,
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
        response: any
      ): Chainable<void>;

      /**
       * Custom command to check if user is authenticated
       * @example cy.checkAuthentication()
       */
      checkAuthentication(): Chainable<boolean>;

      /**
       * Custom command to clear all storage
       * @example cy.clearAllStorage()
       */
      clearAllStorage(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.log(`Logging in as ${email}`);
  
  // Visit home page
  cy.visit('/');
  
  // Click login button
  cy.contains('button', 'Iniciar sesión', { timeout: 10000 }).click();
  
  // Wait for modal
  cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible');
  
  // Fill form
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  
  // Submit
  cy.contains('button', 'Iniciar sesión').click();
  
  // Wait for login to complete
  cy.wait(2000);
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.log('Logging out');
  
  cy.contains('button', 'Cerrar sesión', { timeout: 10000 }).click();
  
  // Wait for logout to complete
  cy.wait(1000);
});

// Get by test ID
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Mock API response
Cypress.Commands.add('mockApiResponse', (url: string, method: string, response: any) => {
  cy.intercept(
    {
      method: method as Cypress.HttpMethod,
      url: url,
    },
    response
  ).as('mockedRequest');
});

// Check authentication
Cypress.Commands.add('checkAuthentication', () => {
  return cy.window().then((win) => {
    const authStorage = win.localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.isAuthenticated === true;
    }
    return false;
  });
});

// Clear all storage
Cypress.Commands.add('clearAllStorage', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

// Prevent TypeScript errors
export {};