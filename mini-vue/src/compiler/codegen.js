import { NodeTypes } from "./ast";

export function generate(ast) {
  return traverseNode(ast);
}

function traverseNode(node) {
  switch (node.type) {
    case NodeTypes.ROOT:
      if (node.children.length === 1) {
        return traverseNode(node.children[0]);
      }
      const result = traverseChildren(node);
      return result;
    case NodeTypes.ELEMENT:
      return createElementVNode(node);
    case NodeTypes.INTERPOLATION:
      return createTextVNode(node.content);
    case NodeTypes.TEXT:
      return createTextVNode(node);
  }
}

function createTextVNode(node) {
  const child = createText(node);
  return `h(Text, null, ${child})`;
}

function createText({ isStatic, content }) {
  return isStatic ? JSON.stringify(content) : content;
}

function createElementVNode(node) {
  const { children } = node;
  const tag = JSON.stringify(node.tag);

  const propArr = createPropArr(node);

  const propStr = propArr.length ? `{${propArr.join(",")}}` : "null";

  if (!children.length) {
    if (propStr === "null") {
      return `h(${tag})`;
    }
    return `h(${tag}, ${propStr})`;
  }

  let childrenStr = traverseChildren(node);
  return `h(${tag}, ${propStr}, ${childrenStr})`;
}

function createPropArr(node) {
  const { props, directives } = node;

  return [
    ...props.map((prop) => `${prop.name}:${createText(prop.value)}`),
    ...directives.map((dir) => {
      switch (dir.name) {
        case "bind":
          break;
        case "on":
          break;
        case "html":
          return `innerHtml:${createText(dir.exp)}`;
      }
    }),
  ];
}

function traverseChildren(node) {
  const { children } = node;
  if (children.length === 1) {
    const child = children[0];
    if (child.type === NodeTypes.TEXT) {
      return createText(child);
    }
    if (child.type === NodeTypes.INTERPOLATION) {
      return createText(child.content);
    }
  }
  const result = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    result.push(traverseNode(child));
  }
  return JSON.stringify(result);
}
