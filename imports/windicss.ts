import { Processor } from "https://esm.sh/windicss@3.0.12/lib";
export {
  CSSParser,
  HTMLParser,
} from "https://esm.sh/windicss@3.0.12/utils/parser";

const processor = new Processor();
const baseHtml = `<html><head></head><body></body></html>`;
const _preflightSheet = processor.preflight(baseHtml);

export function windi(
  template: TemplateStringsArray,
  ...values: unknown[]
): string {
  const classes = template.reduce((query, queryPart, i) => {
    const text = query + queryPart;
    return i < values.length ? text + values[i] : text;
  }, "");
  return processor.compile(classes).styleSheet.build(false);
}

export { Processor };
