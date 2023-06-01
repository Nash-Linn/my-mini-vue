import { patchProps } from "./patchProps";
import { ShapeFlags } from "./vnode";

// 在容器中渲染vnode
export function render(vnode, container) {
  const prevVNode = container._vnode;
  if (!vnode) {
    if (prevVNode) {
      unmount(prevVNode);
    }
  } else {
    patch(prevVNode, vnode, container);
  }
  container._vnode = vnode;
}

function unmount(vnode) {
  const { shapeFlag, el } = vnode;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode.component);
  } else if (shapeFlag & shapeFlag.FRAGMENT) {
    unmountFragment(vnode.children);
  } else {
    el.parentNode.removeChild(el);
  }
}

function unmountComponent(vnode) {}

function processComponent(prevVNode, vnode, container, anchor) {}

function processText(prevVNode, vnode, container, anchor) {
  if (prevVNode) {
    vnode.el = prevVNode.el;
    prevVNode.el.textContent = vnode.children;
  } else {
    mountTextNode(vnode, container, anchor);
  }
}

function processFragment(prevVNode, vnode, container, anchor) {
  const fragmentStartAnchor = (vnode.el = prevVNode
    ? prevVNode.el
    : document.createTextNode(""));
  const fragmentEndAnchor = (vnode.anchor = prevVNode
    ? prevVNode.anchor
    : document.createTextNode(""));

  if (prevVNode) {
    patchChildren(prevVNode, vnode, container, fragmentEndAnchor);
  } else {
    // container.appendChild(fragmentStartAnchor);
    container.insertBefore(fragmentStartAnchor, anchor);
    // container.appendChild(fragmentEndAnchor);
    container.insertBefore(fragmentEndAnchor, anchor);
    mountChildren(vnode.children, container, fragmentEndAnchor);
  }
}

function processElement(prevVNode, vnode, container, anchor) {
  if (prevVNode) {
    patchElement(prevVNode, vnode);
  } else {
    mountElement(vnode, container, anchor);
  }
}

function unmountFragment(vnode) {
  let { el: cur, anchor: end } = vnode;
  const parentNode = cur.parentNode;
  while (cur !== end) {
    let next = cur.nextSibling;
    parentNode.removeChild(cur);
    cur = next;
  }
}

function patch(prevVNode, vnode, container, anchor) {
  if (prevVNode && !isSameVNode(prevVNode, vnode)) {
    anchor = (prevVNode.anchor || prevVNode.el).nextSibing;
    unmount(prevVNode);
    prevVNode = null;
  }
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(prevVNode, vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(prevVNode, vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(prevVNode, vnode, container, anchor);
  } else {
    processElement(prevVNode, vnode, container, anchor);
  }
}

function isSameVNode(prevVNode, vnode) {
  return prevVNode.type === vnode.type;
}

// 根据vnode创建TextNode并渲染，再挂载到容器中
function mountTextNode(vnode, container, anchor) {
  const textNode = document.createTextNode(vnode.children);
  // container.appendChild(textNode);
  container.insertBefore(textNode, anchor);
  vnode.el = textNode;
}

// 根据vnode创建Element并渲染，再挂载到容器中
function mountElement(vnode, container, anchor) {
  const { type, props, shapeFlag, children } = vnode;

  const el = document.createElement(type);
  patchProps(null, props, el);

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  }

  // container.appendChild(el);
  container.insertBefore(el, anchor);
  vnode.el = el;
}
// 渲染vnode的子节点，根据子节点的shapeFlag进行不同的处理
function mountChildren(children, container, anchor) {
  children.forEach((child) => {
    patch(null, child, container, anchor);
  });
}

function patchElement(prevVNode, vnode) {
  vnode.el = prevVNode.el;
  patchProps(prevVNode.props, vnode.props, vnode.el);
  patchChildren(prevVNode, vnode, vnode.el);
}

function patchChildren(prevVNode, vnode, container, anchor) {
  const { shapeFlag: prevShapeFlag, children: prevChildren } = prevVNode;
  const { shapeFlag: vnodeShapeFlag, children: vnodeChildren } = vnode;
  if (vnodeShapeFlag & ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(prevChildren);
    }
    if (vnodeChildren !== prevChildren) {
      container.textContent = vnodeChildren;
    }
  } else if (vnodeShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
      mountChildren(vnodeChildren, container, anchor);
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      patchArrayChildren(prevChildren, vnodeChildren, container, anchor);
    } else {
      mountChildren(vnodeChildren, container, anchor);
    }
  } else {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(prevChildren);
    }
  }
}

function unmountChildren(children) {
  children.forEach((child) => {
    unmount(child);
  });
}

function patchArrayChildren(prevChildren, vnodeChildren, container, anchor) {
  const oldLength = prevChildren.length;
  const newLength = vnodeChildren.length;
  const commonLength = Math.min(oldLength, newLength);
  for (let i = 0; i < commonLength; i++) {
    patch(prevChildren[i], vnodeChildren[i], container, anchor);
  }
  if (oldLength > newLength) {
    unmountChildren(prevChildren.slice(commonLength));
  } else if (oldLength < newLength) {
    mountChildren(vnodeChildren.slice(commonLength), container, anchor);
  }
}
