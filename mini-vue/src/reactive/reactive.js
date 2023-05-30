import { hasChanged, isArray, isObject } from "../utils";
import { track, trigger } from "./effect";

/**
 reactive函数接收一个目标对象作为参数，会检查这个对象是否为一个纯对象，如果不是则直接返回该对象。如果是纯对象且未被代理过，则使用ES6中的Proxy对目标对象进行代理，拦截目标对象属性的读取和修改操作，并在这些操作中分别调用effect模块中的track和trigger函数，最后返回代理对象。 
 isReactive函数接收一个目标对象作为参数，判断该对象是否被代理过，在reactive函数中会给代理对象添加一个名为__isReactive的内部属性，使用!!将其转化为布尔值返回。 
 具体操作步骤如下： 
    1. 导入isObject函数和effect模块中的track、trigger函数。 
    2. 定义reactive函数，接收一个目标对象作为参数。 
    3. 判断该对象是否为纯对象，如果不是则直接返回该对象。 
    4. 判断该对象是否被代理过，如果是则直接返回该对象。 
    5. 使用Proxy对目标对象进行代理。 
    6. 在代理对象的get拦截器中，如果读取的是__isReactive属性，则返回true。反之，调用原对象Reflect.get方法进行读取，并调用effect模块中的track函数。 
    7. 在代理对象的set拦截器中，调用原对象Reflect.set方法进行赋值，并调用effect模块中的trigger函数。 
    8. 返回代理对象。 
    9. 定义isReactive函数，接收一个目标对象作为参数。 
    10. 判断该对象是否被代理过，如果是则返回true，否则返回false。 
 */

const proxyMap = new WeakMap();

export function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (isReactive(target)) {
    return target;
  }

  if (proxyMap.has(target)) {
    return proxyMap.get(target);
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      if (key === "__isReactive") {
        return true;
      }
      const res = Reflect.get(target, key, receiver);
      track(target, key);
      // return res;
      //如果res是对象，则递归调用reactive函数
      return isObject(res) ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      //对数组进行处理
      let oldLength = target.length;

      const oldValue = target[key];
      const res = Reflect.set(target, key, value, receiver);
      //判断新值和旧值是否相等，如果不相等则触发trigger函数
      if (hasChanged(oldValue, value)) {
        trigger(target, key);
        //如果是数组，且修改的是length属性，则触发trigger函数
        if (isArray(target) && hasChanged(oldLength, target.length)) {
          trigger(target, "length");
        }
      }
      return res;
    },
  });

  proxyMap.set(target, proxy);

  return proxy;
}

export function isReactive(target) {
  //去读target中的__isReactive时，会触发get拦截器，如果target是一个代理对象，则返回true
  return !!(target && target.__isReactive);
}
