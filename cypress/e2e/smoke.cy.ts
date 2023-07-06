import { faker } from "@faker-js/faker";

import { formatDatetimeLocalString } from "~/utils/time";

describe("smoke tests", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it("should allow you to register and login", () => {
    const loginForm = {
      username: `${faker.internet.userName({ lastName: "x" })}`,
      password: faker.internet.password(),
    };
    cy.then(() => ({ username: loginForm.username })).as("user");

    cy.visitAndCheck("/");
    cy.findByRole("link", { name: /events/i }).click();

    cy.findByRole("textbox", { name: /username/i }).type(loginForm.username);
    cy.findByLabelText(/password/i).type(loginForm.password);
    cy.findByLabelText(/register/i).click();
    cy.findByRole("button", { name: /submit/i }).click();

    cy.findByRole("button", { name: /logout/i }).click();
    cy.findByLabelText(/login/i);
  });

  it("should allow you to create an event", () => {
    const now = new Date();

    const testEvent = {
      name: faker.lorem.words(3),
      date: formatDatetimeLocalString(
        new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 16)
      ),
      location: faker.location.streetAddress(),
      code: faker.lorem.words(1),
    };

    cy.login();
    cy.visitAndCheck("/");

    cy.findByRole("link", { name: /view events/i }).click();
    cy.findByText("No events");

    cy.findAllByRole("link", { name: /create an event/i })
      .first()
      .click();

    cy.findByRole("textbox", { name: /name/i }).type(testEvent.name);
    cy.get("#date-input").type(testEvent.date); // findByRole not working
    cy.findByRole("textbox", { name: /location/i }).type(testEvent.location);
    cy.findByRole("textbox", { name: /code/i }).type(testEvent.code);
    cy.findByRole("button", { name: /create/i }).click();

    cy.findByRole("button", { name: /delete event/i }); // .click();

    // // https://applitools.com/event/cypress-alerts/
    // cy.on("window:confirm", (txt) => {
    //   //Mocha assertions
    //   expect(txt).to.contains("Are you sure you want to delete this event?");
    //   // return true;
    // });
  });
});
