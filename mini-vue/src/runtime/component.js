import { compile } from "../compiler/compile.js";
import { effect } from "../reactive/effect.js";
import { reactive } from "../reactive/reactive.js";
import { queueJob } from "./scheduler.js";
import { normolizeVNode } from "./vnode.js";

function updateProps(instance, vnode) {
  const { type: Component, props: vnodeProps } = vnode;
  const props = (instance.props = {});
  const attrs = (instance.attrs = {});
  //当前只考虑 props 接收的是数组形式
  for (const key in vnodeProps) {
    if (Component.props.includes(key)) {
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }
  instance.props = reactive(instance.props);
}

function fallThrough(instance, subTree) {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...instance.attrs,
    };
  }
}

export function mounteComponent(vnode, container, anchor, patch) {
  const { type: Component } = vnode;
  const instance = (vnode.component = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    subTree: null,
    isMounted: false,
    update: null,
    next: null,
  });

  updateProps(instance, vnode);

  instance.setupState = Component.setup?.(instance.props, {
    attrrs: instance.attrs,
  });

  // vue中使用代理实现 现在一个对象中去找 没有再去另一个中去找，这里偷懒合并
  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  if (!Component.render && Component.template) {
    let { template } = Component;
    if (template[0] === "#") {
      const el = document.querySelector(template);
      template = el ? el.innerHTML : "";
    }
    const code = compile(template);
    Component.render = new Function("ctx", code);
  }

  instance.update = effect(
    () => {
      if (!instance.isMounted) {
        //mount
        const subTree = (instance.subTree = normolizeVNode(
          Component.render(instance.ctx)
        ));
        fallThrough(instance, subTree);
        patch(null, subTree, container, anchor);
        vnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        //update

        if (instance.next) {
          //被动更新
          vnode = instance.next;
          instance.next = null;
          updateProps(instance, vnode);
        }
        const prev = instance.subTree;
        const subTree = (instance.subTree = normolizeVNode(
          Component.render(instance.ctx)
        ));
        fallThrough(instance, subTree);
        patch(prev, subTree, container, anchor);
        vnode.el = subTree.el;
      }
    },
    {
      scheduler: queueJob,
    }
  );
}
