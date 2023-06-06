import { parse } from ".";
import { generate } from "./codegen";

export function compile(template) {
  const ast = parse(template);
  return generate(ast);
}
