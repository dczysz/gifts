describe("Join event page", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  context("manual entry", () => {
    it("does not allow an invalid event code", () => {
      cy.login();
      cy.visitAndCheck("/events/join");
      cy.findByRole("textbox", { name: /code/i }).type("code");
      cy.findByRole("button", { name: /join/i }).click();
      cy.getByData("code-error")
        .should("exist")
        .contains(/invalid event code/i);
    });

    it("does not allow an empty event code", () => {
      cy.login();
      cy.visitAndCheck("/events/join");
      cy.findByRole("button", { name: /join/i }).click();
      cy.getByData("code-error")
        .should("exist")
        .contains(/invalid event code/i);
    });

    it("does not allow joining an event unless logged in", () => {
      cy.then(() => ({ username: "_" })).as("user"); // test fails if no @user exists for cleanupUser() in afterEach()
      cy.visit("/events/join");
      cy.location("pathname").should("contain", "/login");
      cy.location("search").should("contain", "?redirectTo=%2Fevents%2Fjoin");
    });

    it.skip("allows joining with a valid event code", () => {
      after(() => {
        cy.get("@event").then((event) => {
          const { username } = event as unknown as {
            username: string;
            eventId: string;
            code: string;
          };

          cy.cleanupUser({ username });
          // cy.cleanupEvent({id: eventId})
        });
      });

      cy.login();
      cy.createEvent();
      cy.get("@event").then((event) => {
        // const { username } = event as unknown as {
        //   username: string;
        //   eventId: string;
        //   code: string;
        // };
        // cy.visitAndCheck("/events/join");
      });
    });
  });
});
