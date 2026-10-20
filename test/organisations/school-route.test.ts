import { describe, expect, it } from "vitest";
import { POST } from "@/app/organisations/api/school/route";

const SCHOOL = "11111111-2222-4333-8444-555555555555";

function post(fields: Record<string, string>, headers: Record<string, string> = {}) {
  const body = new URLSearchParams(fields);
  return POST(
    new Request("http://internal:3000/organisations/api/school", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", host: "newdryve.com", ...headers },
      body,
    })
  );
}

describe("school picker route", () => {
  it("remembers the chosen school and returns to the page that asked", async () => {
    const response = await post({ organisation_id: SCHOOL, next: "/organisations/live" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/organisations/live");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`nd_org_school=${SCHOOL}`);
    expect(cookie).toContain("Path=/organisations");
    expect(cookie.toLowerCase()).toContain("httponly");
  });

  it("forgets the choice for 'all my schools' and never redirects off the portal", async () => {
    const response = await post({ next: "https://evil.example/" });
    expect(response.headers.get("location")).toBe("/organisations");
    expect(response.headers.get("set-cookie") ?? "").toMatch(/nd_org_school=;/);
  });

  it("refuses a post from another site", async () => {
    const response = await post({ organisation_id: SCHOOL }, { origin: "https://evil.example" });
    expect(response.status).toBe(403);
  });
});
