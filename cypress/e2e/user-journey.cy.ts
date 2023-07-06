import { faker } from "@faker-js/faker";
import { formatDatetimeLocalString } from "~/utils/time";

describe("User journey", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it("allows a user to create and interact with an event", () => {
    const now = new Date();
    const yearFromNow = formatDatetimeLocalString(
      new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 16)
    );

    // Automatically answer 'yes' to all confirm boxes
    cy.on("window:confirm", () => true);

    cy.login();
    cy.visitAndCheck("/events");

    cy.findByText("No events");

    cy.findAllByRole("link", { name: /create an event/i })
      .first()
      .click();

    cy.findByRole("textbox", { name: /name/i }).type(faker.lorem.words(3));
    cy.get("#date-input").type(yearFromNow);
    cy.findByRole("textbox", { name: /location/i }).type(
      faker.location.streetAddress()
    );
    cy.findByRole("textbox", { name: /code/i }).type(faker.lorem.words(1));
    cy.findByRole("button", { name: /create/i }).click();

    // Edit profile
    cy.findByRole("button", { name: /save/i }).click();
    cy.findByRole("link", { name: /edit profile/i }).click();
    cy.findByRole("button", { name: /randomize avatar/i }).click();
    cy.findByRole("textbox", { name: /name/i }).clear().type("Cypress");
    cy.findByRole("button", { name: /save/i }).click();

    // Send a top level event comment and delete it
    cy.findByRole("link", { name: /event discussion/i }).click();
    cy.getByData("comment-input").type("hello from Cypress!");
    cy.getByData("comment-submit").click();
    cy.getByData("delete-comment").click();
    cy.getByData("delete-comment").should("not.exist");
    cy.findByText(/no messages to display/i).should("exist");

    // Create a list item and delete it
    cy.findByRole("link", { name: /your list/i }).click();
    cy.findByRole("textbox", { name: /name/i }).type("A cool thing");
    cy.findByRole("textbox", { name: /link/i }).type("https://docs.cypress.io");
    cy.findByLabelText(/quantity/i).type("1");
    cy.findByRole("button", { name: /add/i }).click();
    cy.getByData("delete-item").click();
    cy.wait(100);
    cy.findByText(/this list is empty/i).should("exist");
  });
});
