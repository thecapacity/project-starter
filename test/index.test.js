import { readFileSync } from "fs";
import { expect, it } from "vitest";

it("index.html contains Hello World heading", () => {
  const html = readFileSync("site/index.html", "utf-8");
  expect(html).toContain('<h1 id="heading">Hello, World!</h1>');
});
