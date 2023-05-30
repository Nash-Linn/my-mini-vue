//判断是否是对象
export function isObject(target) {
  return typeof target === "object" && target !== null;
}

//判读两个值是否相等
export function hasChanged(oldValue, newValue) {
  return (
    oldValue !== newValue && !(Number.isNaN(oldValue) && Number.isNaN(newValue))
  );
}

//判断是否是数组
export function isArray(target) {
  return Array.isArray(target);
}

export function isFunction(target) {
  return typeof target === "function";
}
