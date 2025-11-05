// cypress/e2e/auth.cy.ts - Versión Simplificada
/// <reference types="cypress" />

describe('Authentication Flow - Simple', () => {
  beforeEach(() => {
    cy.clearAllStorage();
    cy.visit('/');
    cy.get('nav', { timeout: 10000 }).should('be.visible');
    cy.wait(1000); // Dar tiempo para que todo cargue
  });

  describe('UI Elements', () => {
    it('should display authentication buttons when logged out', () => {
      // Verificar que hay botones de auth
      cy.get('button').should('have.length.greaterThan', 0);

      // Buscar botón de convertirse en anfitrión O botón con icono
      cy.get('body').then(($body) => {
        const hasHostButton = $body.find('button:contains("Convertirme en anfitrión")').length > 0;
        const hasAuthButton = $body.find('button').filter((i, el) => {
          const text = Cypress.$(el).text();
          return text.includes('anfitrión') || Cypress.$(el).find('i.fa-user').length > 0;
        }).length > 0;

        expect(hasHostButton || hasAuthButton).to.be.true;
      });
    });
  });
})