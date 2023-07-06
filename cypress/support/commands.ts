import { faker } from "@faker-js/faker";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in with a random user. Yields the user and adds an alias to the user
       *
       * @returns {typeof login}
       * @memberof Chainable
       * @example
       *    cy.login()
       * @example
       *    cy.login({ username: 'some-username' })
       */
      login: typeof login;

      /**
       * Deletes the current @user
       *
       * @returns {typeof cleanupUser}
       * @memberof Chainable
       * @example
       *    cy.cleanupUser()
       * @example
       *    cy.cleanupUser({ username: 'some-username' })
       */
      cleanupUser: typeof cleanupUser;

      /**
       * Extends the standard visit command to wait for the page to load
       *
       * @returns {typeof visitAndCheck}
       * @memberof Chainable
       * @example
       *    cy.visitAndCheck('/')
       *  @example
       *    cy.visitAndCheck('/', 500)
       */
      visitAndCheck: typeof visitAndCheck;

      getByData: typeof getByData;

      createEvent: typeof createEvent;
    }
  }
}

function login({
  username = faker.internet.userName(),
}: {
  username?: string;
} = {}) {
  cy.then(() => ({ username })).as("user");
  cy.exec(
    `npx ts-node --require tsconfig-paths/register ./cypress/support/create-user.ts "${username}"`
  ).then(({ stdout }) => {
    const cookieValue = stdout
      .replace(/.*<cookie>(?<cookieValue>.*)<\/cookie>.*/s, "$<cookieValue>")
      .trim();
    cy.setCookie("__session", cookieValue);
  });
  return cy.get("@user");
}

function cleanupUser({ username }: { username?: string } = {}) {
  if (username) {
    deleteUserByUsername(username);
  } else {
    cy.get("@user").then((user) => {
      const username = (user as { username?: string }).username;
      if (username) {
        deleteUserByUsername(username);
      }
    });
  }
  cy.clearCookie("__session");
}

function deleteUserByUsername(username: string) {
  cy.exec(
    `npx ts-node --require tsconfig-paths/register ./cypress/support/delete-user.ts "${username}"`
  );
  cy.clearCookie("__session");
}

// We're waiting a second because of this issue happen randomly
// https://github.com/cypress-io/cypress/issues/7306
// Also added custom types to avoid getting detached
// https://github.com/cypress-io/cypress/issues/7306#issuecomment-1152752612
// ===========================================================
function visitAndCheck(url: string, waitTime: number = 1000) {
  cy.visit(url);
  cy.location("pathname").should("contain", url).wait(waitTime);
}

function getByData(selector: string) {
  return cy.get(`[data-test='${selector}']`);
}

function createEvent() {
  cy.exec(
    `npx ts-node --require tsconfig-paths/register ./cypress/support/create-event.ts`
  )
    .then(({ stdout }) => JSON.parse(stdout))
    .as("event");

  return cy.get("@event");
}

Cypress.Commands.add("login", login);
Cypress.Commands.add("cleanupUser", cleanupUser);
Cypress.Commands.add("visitAndCheck", visitAndCheck);
Cypress.Commands.add("getByData", getByData);
Cypress.Commands.add("createEvent", createEvent);
