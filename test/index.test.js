import { readFileSync } from "fs";
import { expect, it } from "vitest";

it("index.html uses the link-surfer web component", () => {
  const html = readFileSync("site/index.html", "utf-8");
  expect(html).toContain("<link-surfer>");
});

it("index.html includes the surfer-toolbar component", () => {
  const html = readFileSync("site/index.html", "utf-8");
  expect(html).toContain("<surfer-toolbar>");
});

it("index.html loads main.js as a module", () => {
  const html = readFileSync("site/index.html", "utf-8");
  expect(html).toContain('type="module"');
  expect(html).toContain("main.js");
});

it("index.html disables user-scalable for touch gesture accuracy", () => {
  const html = readFileSync("site/index.html", "utf-8");
  expect(html).toContain("user-scalable=no");
});
