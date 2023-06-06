import { isString } from "../utils";
import { h, render } from "./index";

export function createApp(rootComponent) {
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
