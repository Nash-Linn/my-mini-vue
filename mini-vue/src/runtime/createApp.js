import { isString } from "../utils";
import { h, render } from "./index";

export function createApp(rootComponent) {
  const app = {
    mount(rootContainer) {
      if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer);
      }
      render(h(rootComponent), rootContainer);
    },
  };

  return app;
}
