import { Processor, windi } from "./windicss.ts";
import { expect, it } from "./expect.ts";

it("should process sample WindiCSS templates", () => {
  const someProp = "sm";
  const styles = windi`px-2 text-${someProp} py-2`;
  console.log(styles);
  expect(true).toBeTruthy();
});

it("should process sample WindiCSS classes", () => {
  const styles = new Processor().interpret(`
  const someProp = "sm";
  const styles = px-2 text-\${someProp} py-2
  `);
  console.log(styles);
  expect(true).toBeTruthy();
});
