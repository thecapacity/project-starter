import { readFileSync } from "fs";
import { expect, it } from "vitest";

it("index.html contains Hello World heading", () => {
  const html = readFileSync("site/index.html", "utf-8");
  expect(html).toContain('<h1 id="heading">Hello, World!</h1>');
});

it("index.html uses web component tags for layout chrome", () => {
  const html = readFileSync("site/index.html", "utf-8");
  expect(html).toContain("<site-header>");
  expect(html).toContain("<site-nav>");
  expect(html).toContain("<site-footer>");
});

it("about.html reuses the same web component layout chrome", () => {
  const html = readFileSync("site/about.html", "utf-8");
  expect(html).toContain("<site-header>");
  expect(html).toContain("<site-nav>");
  expect(html).toContain("<site-footer>");
});
