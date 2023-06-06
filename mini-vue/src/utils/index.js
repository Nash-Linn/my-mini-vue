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

//判断是否是字符串
export function isString(target) {
  return typeof target === "string";
}

//判断是否是数字
export function isNumber(target) {
  return typeof target === "number";
}

//判断是否是布尔值
export function isBoolean(target) {
  return typeof target === "boolean";
}

//驼峰化
export function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
}

export function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}
