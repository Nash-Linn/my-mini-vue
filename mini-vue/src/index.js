import { compile } from "./compiler/index.js";

import {
  createApp,
  render,
  h,
  Text,
  Fragment,
  renderList,
  nextTick,
} from "./runtime";

import { reactive, ref, computed, effect } from "./reactive/index.js";

export const MiniVue = (window.MiniVue = {
  createApp,
  render,
  h,
  Text,
  Fragment,
  renderList,
  nextTick,
  reactive,
  ref,
  computed,
  effect,
  compile,
});
