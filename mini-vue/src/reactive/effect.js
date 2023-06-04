const effectStack = [];
let activeEffect;

export function effect(fn, option = {}) {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(activeEffect);
      return fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  };
  if (!option.lazy) {
    effectFn();
  }
  effectFn.scheduler = option.scheduler;
  return effectFn;
}

/**
 * targetMap用于存储副作用，并建立副作用和依赖的对应关系
 * 一个副作用可能会依赖多个响应式对象，一个响应式对象里可能依赖多个属性
 * 同一个属性又可能被多个副作用依赖，因此targetMap的结构为：
 *  {
 *    //这是一个WeakMap，key为响应式对象，value为Map
 *    [target]: { //key是reactiveObject，value为Map
 *      [key]:[]  //key是reactiveObject，value为Set
 *    }
 *  }
 */

// 创建一个 WeakMap，存储目标对象
const targetMap = new WeakMap();
//收集依赖
export function track(target, key) {
  // 如果没有活动的 effect，直接返回
  if (!activeEffect) return;
  // 获取目标对象的依赖关系
  let depsMap = targetMap.get(target);
  // 如果目标对象不存在依赖关系，就创建一个 Map 存储依赖关系
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  // 获取目标对象的某个属性的依赖集合
  let deps = depsMap.get(key);
  // 如果依赖集合不存在，就创建一个 Set 存储依赖
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  // 添加活动的 effect 到依赖集合中
  deps.add(activeEffect);
}

//触发依赖
export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  if (!deps) return;

  deps.forEach((effectFn) => {
    if (effectFn.scheduler) {
      effectFn.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}
