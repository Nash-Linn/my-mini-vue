import { isBoolean } from "../utils";
import { ShapeFlags } from "./vnode";

// 用于匹配属性名
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;

// 在容器中渲染vnode
export function render(vnode, container) {
  mount(vnode, container);
}
// 根据vnode的shapeFlag决定如何渲染
function mount(vnode, container) {
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    mountElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    mountTextNode(vnode, container);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container);
  } else {
    mountComponent(vnode, container);
  }
}
// 根据vnode创建Element并渲染，再挂载到容器中
function mountElement(vnode, container) {
  const { type, props } = vnode;
  const el = document.createElement(type);
  mountProps(props, el);
  mountChildren(vnode, el);
  container.appendChild(el);
}
// 根据vnode创建TextNode并渲染，再挂载到容器中
function mountTextNode(vnode, container) {
  const textNode = document.createTextNode(vnode.children);
  container.appendChild(textNode);
}
// Fragment只需要渲染其子节点，再挂载到容器中
function mountFragment(vnode, container) {
  mountChildren(vnode, container);
}

function mountComponent(vnode, container) {}
// 渲染vnode的子节点，根据子节点的shapeFlag进行不同的处理
function mountChildren(vnode, container) {
  const { shapeFlag, children } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, container);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    children.forEach((v) => mount(v, container));
  }
}
// 根据props为Element设置属性
function mountProps(props, el) {
  for (const key in props) {
    const value = props[key];
    switch (key) {
      case "class":
        el.className = value;
        break;
      case "style":
        for (const styleName in value) {
          el.style[styleName] = value[styleName];
        }
        break;
      default:
        // 如果key以'on'开头，则表示该属性是事件绑定，将其作为元素的事件监听器
        if (/^on[^a-z]/.test(key)) {
          const eventName = key.slice(2).toLowerCase();
          el.addEventListener(eventName, value);
        } else if (domPropsRE.test(key)) {
          // {'checked'：''}
          if (value == "" && isBoolean(el[key])) {
            value = true;
          }
          el[key] = value;
        } else {
          if (value == null || value === false) {
            el.removeAttribute(key);
          } else {
            el.setAttribute(key, value);
          }
        }
    }
  }
}
