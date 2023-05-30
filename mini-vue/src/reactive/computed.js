import { isFunction } from "../utils";
import { effect, track, trigger } from "./effect";

export function computed(getterOrOptions) {
  let getter, setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.warn("computed value must be readonly");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedImpl(getter, setter);
}

class ComputedImpl {
  constructor(getter, setter) {
    this._setter = setter;
    this._value = undefined;
    this._dirty = true; //是否需要重新计算
    this.effect = effect(getter, {
      lazy: true, //懒执行 让effectFn不会立即执行
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
          trigger(this, "value");
        }
      },
    });
  }

  get value() {
    if (this._dirty) {
      //重新计算
      this._value = this.effect();
      this._dirty = false;
      track(this, "value");
    }
    return this._value;
  }

  set value(newValue) {
    this._setter(newValue);
  }
}
