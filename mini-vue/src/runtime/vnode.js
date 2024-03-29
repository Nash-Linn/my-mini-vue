import { isArray, isNumber, isObject, isString } from "../utils";

export const ShapeFlags = {
  ELEMENT: 1, // 0000000000000001
  TEXT: 1 << 1, // 0000000000000010
  FRAGMENT: 1 << 2, // 0000000000000100
  COMPONENT: 1 << 3, // 0000000000001000
  TEXT_CHILDREN: 1 << 4, // 0000000000010000
  ARRAY_CHILDREN: 1 << 5, // 0000000000100000
  CHILDREN: (1 << 4) | (1 << 5), // 0000000000110000
};

export const Text = Symbol("Text");

export const Fragment = Symbol("Fragment");

/**
 *
 * @param {string | Object | Text | Fragment} type
 * @param {Object | null} props
 * @param {string | number | Array | null} children
 * @returns VNode
 */
export function h(type, props, children) {
  let shapeFlag = 0;

  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT;
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT;
  } else if (type === Fragment) {
    shapeFlag = ShapeFlags.FRAGMENT;
  } else {
    shapeFlag = ShapeFlags.COMPONENT;
  }

  if (isString(children) || isNumber(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    children = children.toString();
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  return {
    type,
    props,
    children,
    shapeFlag,
    el: null,
    anchor: null,
    key: props && props.key,
    component: null, //用于存储组件的实例
  };
}

export function normolizeVNode(result) {
  if (isArray(result)) {
    return h(Fragment, null, result);
  }
  if (isObject(result)) {
    return result;
  }
  //string,number
  return h(Text, null, result.toString());
}
