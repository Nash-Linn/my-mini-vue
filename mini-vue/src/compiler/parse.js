import { NodeTypes, ElementTypes, createRoot } from "./ast";
export function parse(content) {
  const context = createParserContext(content);
}

function createParserContext(content) {
  return {
    source: content,
  };
}
