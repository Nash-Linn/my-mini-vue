import { camelize, capitalize, isString } from "../utils";
import { h, render } from "./index";
let components;

export function createApp(rootComponent) {
  components = rootComponent.components || {};
  const app = {
    mount(rootContainer) {
      if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer);
      }
      if (!rootComponent.render && !rootComponent.template) {
        rootComponent.template = rootContainer.innerHTML;
      }
      rootContainer.innerHTML = "";
      render(h(rootComponent), rootContainer);
    },
  };

  return app;
}

export function resolveComponent(name) {
  return (
    components &&
    (components[name] ||
      components[camelize(name)] ||
      components[capitalize(camelize(name))])
  );
}
