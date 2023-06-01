import { isBoolean } from "../utils";

export function patchProps(oldProps, newProps, el) {
  if (oldProps === newProps) {
    return;
  }
  oldProps = oldProps || {}; //如果oldProps为null，则将其赋值为空对象
  newProps = newProps || {};
  for (const key in newProps) {
    const next = newProps[key];
    const prev = oldProps[key];
    if (prev !== next) {
      patchDomProps(prev, next, key, el);
    }
  }
  //移除oldProps中newProps中没有的属性
  for (const key in oldProps) {
    if (newProps[key] == null) {
      patchDomProps(oldProps[key], null, key, el);
    }
  }
}

export const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;

export function patchDomProps(prev, next, key, el) {
  switch (key) {
    case "class":
      el.className = next || "";
      break;
    case "style":
      if (next == null) {
        el.removeAttribute("style");
      } else {
        for (const styleName in next) {
          el.style[styleName] = next[styleName];
        }
        if (prev) {
          for (const styleName in prev) {
            if (next[styleName] == null) {
              el.style[styleName] = "";
            }
          }
        }
      }

      break;
    default:
      // 如果key以'on'开头，则表示该属性是事件绑定，将其作为元素的事件监听器
      if (/^on[^a-z]/.test(key)) {
        const eventName = key.slice(2).toLowerCase();
        if (prev) {
          el.removeEventListener(eventName, prev);
        }
        if (next) {
          el.addEventListener(eventName, next);
        }
        el.addEventListener(eventName, next);
      } else if (domPropsRE.test(key)) {
        // {'checked'：''}
        if (next == "" && isBoolean(el[key])) {
          next = true;
        }
        el[key] = next;
      } else {
        if (next == null || next === false) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, next);
        }
      }
  }
}
