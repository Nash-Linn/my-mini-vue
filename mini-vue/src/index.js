import { computed } from "./reactive/computed";
import { effect } from "./reactive/effect";
import { reactive } from "./reactive/reactive";
import { ref } from "./reactive/ref";

import { render, h, Text, Fragment } from "./runtime";

//---------------------------------------------------------
// const observed = (window.observed = reactive({
//   count: 0,
//   obj: {
//     a: 1,
//     b: {
//       x: 3,
//     },
//   },
// }));

// effect(() => {
//   console.log("observed.count is", observed.count);
//   console.log("observed.obj.b.x is", observed.obj.b.x);
// });

//---------------------------------------------------------

// const observed1 = (window.observed1 = reactive([1, 2, 3]));

// effect(() => {
//   console.log("observed1 is", observed1);
//   console.log("observed1.length is", observed1.length);
// });

//---------------------------------------------------------

// const observed2 = (window.observed2 = reactive({
//   count1: 0,
//   count2: 0,
// }));

// effect(() => {
//   effect(() => {
//     console.log("count2 is", observed2.count2);
//   });
//   console.log("count1 is", observed2.count1);
// });

//---------------------------------------------------------

// const foo = (window.foo = ref(1));

// effect(() => {
//   console.log("foo is", foo.value);
// });

//---------------------------------------------------------

// const num = (window.num = ref(1));

// const num2double = (window.num2double = computed(() => {
//   return num.value * 2;
// }));

// const num2double = (window.num2double = computed({
//   get() {
//     return num.value * 2;
//   },
//   set(val) {
//     num.value = val / 2;
//   },
// }));

//---------------------------------------------------------

const vnode = h(
  "div",
  {
    class: "a b",
    style: {
      border: "1px solid ",
      fontSize: "14px",
    },
    onClick: () => {
      console.log("click");
    },
    id: "foo",
    checked: "",
    custom: false,
  },
  [
    h("ul", null, [
      h("li", { style: { color: "red" } }, "1"),
      h("li", null, "2"),
      h("li", { style: { color: "blue" } }, "3"),
      h(Fragment, null, [h("li", null, "4"), h("li")]),
      h("li", null, [h(Text, null, "hello world")]), // span is not a valid child of ul
    ]),
  ]
);

render(vnode, document.body);
