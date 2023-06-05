import { NodeTypes, ElementTypes, createRoot } from "./ast";
import { isVoidTag, isNativeTag } from "./index";

export function parse(content) {
  const context = createParserContext(content);
  const children = parseChildren(context);
  return createRoot(children);
}

function createParserContext(content) {
  return {
    options: {
      delimiters: ["{{", "}}"],
      isVoidTag,
      isNativeTag,
    },
    source: content,
  };
}

function parseChildren(context) {
  //不进行错误处理 暂认为都是正确的

  const nodes = [];

  while (!isEnd(context)) {
    const s = context.source;
    let node;

    if (s.startsWith(context.options.delimiters[0])) {
      //parseInterpolation
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      //parseElement
      node = parseElement(context);
    } else {
      //parseText
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

//解析插值节点
function parseInterpolation(context) {
  const [open, close] = context.options.delimiters;
  advanceBy(context, open.length);

  const closeIndex = context.source.indexOf(close);

  const content = parseTextData(context, closeIndex).trim();

  advanceBy(context, close.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      isStatic: false,
    },
  };
}

function parseElement(context) {
  //start tag
  const element = parseTag(context);
  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element;
  }

  //parseChildren
  element.children = parseChildren(context);

  //end tag  为了去除相对应的结束标签
  parseTag(context);

  return element;
}

function parseTag(context) {
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  // 认为存在匹配 不进行错误处理
  const tag = match[1];

  advanceBy(context, match[0].length);
  advanceSpaces(context);

  const { props, directives } = parseAttributes(context);

  const isSelfClosing = context.source.startsWith("/>");
  advanceBy(context, isSelfClosing ? 2 : 1);

  const tagType = isComponent(tag, context)
    ? ElementTypes.COMPONENT
    : ElementTypes.ELEMENT;

  return {
    type: NodeTypes.ELEMENT,
    tag, //标签名
    tagType, //是组件还是原生元素
    props, //属性节点数组
    directives, //指令节点数组
    isSelfClosing, //是否自闭合
    children: [], //子节点数组
  };
}

function isComponent(tag, context) {
  return !context.options.isNativeTag(tag);
}

function parseAttributes(context) {
  const props = [];
  const directives = [];

  while (
    context.source.length ||
    context.source.startsWith(">") ||
    context.source.startsWith("/>")
  ) {
    let attr = parseAttribute(context);
    if (attr.type === NodeTypes.DIRECTIVE) {
      directives.push(attr);
    } else {
      props.push(attr);
    }
  }

  return {
    props,
    directives,
  };
}

function parseAttribute(context) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];

  advanceBy(context, name.length);
  advanceSpaces(context);

  let value;
  if (context.source[0] === "=") {
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
  }

  // Directive
  if (/^(:|@|v-)/.test(name)) {
    if (name[0] === ":") {
    } else if (name[0] === "@") {
    } else if (name.startsWith("v-")) {
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name,
      exp:
        undefined |
        {
          type: NodeTypes.SIMPLE_EXPRESSION, //表达式节点
          content: value.content,
          isStatic: false,
        },
      arg:
        undefined |
        {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: string,
          isStatic: true,
        },
    };
  }

  // Attribute
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    },
  };
}

function parseAttributeValue(context) {
  const quote = context[0];
  advanceBy(context, 1); // 去除属性开始的 引号

  const endIndex = context.source.indexOf(quote);

  const content = parseTextData(context, endIndex);

  advanceBy(context, 1); // 去除属性结束的 引号

  return { content };
}

//缺陷： 不支持文本节点中包含 < 的情况
// a < b 会被截断
// </
function parseText(context) {
  const endTokens = ["<", context.options.delimiters[0]];
  let endIndex = context.source.length;

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context, length) {
  const text = context.source.slice(0, length);
  advanceBy(context, length);
  return text;
}

function isEnd(context) {
  const s = context.source;

  return s.startsWith("</") || !s;
}

function advanceBy(context, numberOfCharacters) {
  context.source = context.source.slice(numberOfCharacters);
}

//去除空格
function advanceSpaces(context) {
  //匹配空格
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length); //match[0].length 空格的长度
  }
}
