import { validateEventName } from "./validators";

describe("validator functions", () => {
  it("validates event name", () => {
    expect(validateEventName("")).toContain("too short");
    expect(validateEventName("Name")).toBeUndefined();
  });
});
