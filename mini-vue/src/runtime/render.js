import { mounteComponent } from "./component";
import { patchProps } from "./patchProps";
import { ShapeFlags } from "./vnode";

// 在容器中渲染vnode
export function render(vnode, container) {
  const prevVNode = container._vnode;
  if (!vnode) {
    if (prevVNode) {
      unmount(prevVNode);
    }
  } else {
    patch(prevVNode, vnode, container);
  }
  container._vnode = vnode;
}

function unmount(vnode) {
  const { shapeFlag, el } = vnode;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode.component);
  } else if (shapeFlag & shapeFlag.FRAGMENT) {
    unmountFragment(vnode.children);
  } else {
    el.parentNode.removeChild(el);
  }
}

function unmountComponent(vnode) {
  unmount(vnode.component.subTree);
}

function processComponent(prevVNode, vnode, container, anchor) {
  if (prevVNode) {
    //shouldComponentUpdate 可以增加是否需要被动更新的判断
    updateComponent(prevVNode, vnode);
  } else {
    mounteComponent(vnode, container, anchor, patch);
  }
}

function updateComponent(prevVNode, vnode) {
  vnode.component = prevVNode.component;
  vnode.component.next = vnode;
  vnode.component.update();
}

function processText(prevVNode, vnode, container, anchor) {
  if (prevVNode) {
    vnode.el = prevVNode.el;
    prevVNode.el.textContent = vnode.children;
  } else {
    mountTextNode(vnode, container, anchor);
  }
}

function processFragment(prevVNode, vnode, container, anchor) {
  const fragmentStartAnchor = (vnode.el = prevVNode
    ? prevVNode.el
    : document.createTextNode(""));
  const fragmentEndAnchor = (vnode.anchor = prevVNode
    ? prevVNode.anchor
    : document.createTextNode(""));

  if (prevVNode) {
    patchChildren(prevVNode, vnode, container, fragmentEndAnchor);
  } else {
    // container.appendChild(fragmentStartAnchor);
    container.insertBefore(fragmentStartAnchor, anchor);
    // container.appendChild(fragmentEndAnchor);
    container.insertBefore(fragmentEndAnchor, anchor);
    mountChildren(vnode.children, container, fragmentEndAnchor);
  }
}

function processElement(prevVNode, vnode, container, anchor) {
  if (prevVNode) {
    patchElement(prevVNode, vnode);
  } else {
    mountElement(vnode, container, anchor);
  }
}

function unmountFragment(vnode) {
  let { el: cur, anchor: end } = vnode;
  const parentNode = cur.parentNode;
  while (cur !== end) {
    let next = cur.nextSibling;
    parentNode.removeChild(cur);
    cur = next;
  }
}

function patch(prevVNode, vnode, container, anchor) {
  if (prevVNode && !isSameVNode(prevVNode, vnode)) {
    anchor = (prevVNode.anchor || prevVNode.el).nextSibing;
    unmount(prevVNode);
    prevVNode = null;
  }
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(prevVNode, vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(prevVNode, vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(prevVNode, vnode, container, anchor);
  } else {
    processElement(prevVNode, vnode, container, anchor);
  }
}

function isSameVNode(prevVNode, vnode) {
  return prevVNode.type === vnode.type;
}

// 根据vnode创建TextNode并渲染，再挂载到容器中
function mountTextNode(vnode, container, anchor) {
  const textNode = document.createTextNode(vnode.children);
  // container.appendChild(textNode);
  container.insertBefore(textNode, anchor);
  vnode.el = textNode;
}

// 根据vnode创建Element并渲染，再挂载到容器中
function mountElement(vnode, container, anchor) {
  const { type, props, shapeFlag, children } = vnode;

  const el = document.createElement(type);
  patchProps(null, props, el);

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  }

  // container.appendChild(el);
  container.insertBefore(el, anchor);
  vnode.el = el;
}
// 渲染vnode的子节点，根据子节点的shapeFlag进行不同的处理
function mountChildren(children, container, anchor) {
  children.forEach((child) => {
    patch(null, child, container, anchor);
  });
}

function patchElement(prevVNode, vnode) {
  vnode.el = prevVNode.el;
  patchProps(prevVNode.props, vnode.props, vnode.el);
  patchChildren(prevVNode, vnode, vnode.el);
}

function patchChildren(prevVNode, vnode, container, anchor) {
  const { shapeFlag: prevShapeFlag, children: prevChildren } = prevVNode;
  const { shapeFlag: vnodeShapeFlag, children: vnodeChildren } = vnode;
  if (vnodeShapeFlag & ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(prevChildren);
    }
    if (vnodeChildren !== prevChildren) {
      container.textContent = vnodeChildren;
    }
  } else if (vnodeShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
      mountChildren(vnodeChildren, container, anchor);
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //只要第一个元素有key，那么就当作都有key
      if (
        prevChildren[0] &&
        prevChildren[0].key != null &&
        vnodeChildren[0] &&
        vnodeChildren[0].key != null
      ) {
        patchKeyedChildren(prevChildren, vnodeChildren, container, anchor);
      }
      patchUnkeyedChildren(prevChildren, vnodeChildren, container, anchor);
    } else {
      mountChildren(vnodeChildren, container, anchor);
    }
  } else {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(prevChildren);
    }
  }
}

function unmountChildren(children) {
  children.forEach((child) => {
    unmount(child);
  });
}

// 较为粗暴处理数组类型的子节点 优化为 有key 和 无key 情况
function patchUnkeyedChildren(prevChildren, vnodeChildren, container, anchor) {
  const oldLength = prevChildren.length;
  const newLength = vnodeChildren.length;
  const commonLength = Math.min(oldLength, newLength);
  for (let i = 0; i < commonLength; i++) {
    patch(prevChildren[i], vnodeChildren[i], container, anchor);
  }
  if (oldLength > newLength) {
    unmountChildren(prevChildren.slice(commonLength));
  } else if (oldLength < newLength) {
    mountChildren(vnodeChildren.slice(commonLength), container, anchor);
  }
}

// 优化 根据key决定是否重新渲染
function patchKeyedChildren1(prevChildren, vnodeChildren, container, anchor) {
  const map = new Map();
  prevChildren.forEach(prev, (j) => {
    map.set(prev.key, { prev, j });
  });
  let maxNewIndexSoFar = 0;
  for (let i = 0; i < vnodeChildren.length; i++) {
    const next = vnodeChildren[i];
    const curAnchor =
      i === 0 ? prevChildren[0].el : vnodeChildren[i - 1].el.nextSibling;
    if (map.has(next.key)) {
      const { prev, j } = map.get(next.key);
      patch(prev, next, container, anchor);
      if (j < maxNewIndexSoFar) {
        // 移动
        container.insertBefore(next.el, curAnchor);
      } else {
        maxNewIndexSoFar = j;
      }
      map.delete(next.key);
    } else {
      patch(null, next, container, curAnchor);
    }
  }

  map.forEach(({ prev }) => {
    unmount(prev);
  });
}

function patchKeyedChildren(prevChildren, vnodeChildren, container, anchor) {
  let i = 0;
  let e1 = prevChildren.length - 1;
  let e2 = vnodeChildren.length - 1;
  //1.从左至右依次比较
  while (i <= e1 && i <= e2 && prevChildren[i].key === vnodeChildren[i].key) {
    patch(prevChildren[i], vnodeChildren[i], container, anchor);
    i++;
  }

  //2.从右至左依次比较
  while (i <= e1 && i <= e2 && prevChildren[e1].key === vnodeChildren[e2].key) {
    patch(prevChildren[e1], vnodeChildren[e2], container, anchor);
    e1--;
    e2--;
  }
  //3. 经过1，2直接将旧节点比对完，则剩下的新节点直接mount
  if (i > e1) {
    for (let j = i; j <= e2; j++) {
      const nextPos = e2 + 1;
      const curAnchor =
        (vnodeChildren[nextPos] && vnodeChildren[nextPos].el) || anchor;

      patch(null, vnodeChildren[j], container, curAnchor);
    }
  } else if (i > e2) {
    //3. 经过1，2直接将新节点比对完，则剩下的旧节点直接unmount
    for (let j = i; j <= e1; j++) {
      unmount(prevChildren[j]);
    }
  } else {
    //4.若不满足 3，采用传统diff算法，但不真的添加和移动，只做标记和删除
    const map = new Map();
    for (let j = i; j <= e1; j++) {
      const prev = prevChildren[j];
      map.set(prev.key, { prev, j });
    }

    let maxNewIndexSoFar = 0;
    let move = false;
    const source = new Array(e2 - i + 1).fill(-1);
    const toMounted = [];
    for (let k = 0; k < source.length; k++) {
      const next = vnodeChildren[k + i];
      const curAnchor =
        k === 0 ? prevChildren[0].el : vnodeChildren[k - 1].el.nextSibling;
      if (map.has(next.key)) {
        const { prev, j } = map.get(next.key);
        patch(prev, next, container, anchor);
        if (j < maxNewIndexSoFar) {
          move = true;
        } else {
          maxNewIndexSoFar = j;
        }
        source[k] = j;
        map.delete(next.key);
      } else {
        //
        toMounted.push(k + i);
      }
    }

    map.forEach(({ prev }) => {
      unmount(prev);
    });
    if (move) {
      // 5. 需要移动，采用最长上升子序列算法
      const seq = getSequence(source);
      let j = seq.length - 1;
      for (let k = source.length - 1; k >= 0; k--) {
        if (source[k] === -1) {
          //mount
          const pos = k + i;
          const nextPos = pos + 1;
          const curAnchor =
            (vnodeChildren[nextPos] && vnodeChildren[nextPos].el) || anchor;
          patch(null, vnodeChildren[pos], container, curAnchor);
        } else if (seq[j] === k) {
          //不用移动
          j--;
        } else {
          //移动
          const pos = k + i;
          const nextPos = pos + 1;
          const curAnchor =
            (vnodeChildren[nextPos] && vnodeChildren[nextPos].el) || anchor;
          container.insertBefore(vnodeChildren[pos].el, curAnchor);
        }
      }
    } else if (toMounted.length) {
      //特殊情况，不需要移动，但还有未添加的元素
      for (let k = toMounted.length - 1; k >= 0; k--) {
        const pos = toMounted[k];
        const nextPos = pos + 1;
        const curAnchor =
          (vnodeChildren[nextPos] && vnodeChildren[nextPos].el) || anchor;
        patch(null, vnodeChildren[pos], container, curAnchor);
      }
    }
  }
}

//最长上升子序列算法
function getSequence(nums) {
  const arr = [nums[0]];
  const position = [0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
      position.push(arr.length - 1);
    } else {
      let left = 0;
      let right = arr.length - 1;
      while (left < right) {
        const mid = (left + right) >> 1;
        if (arr[mid] < nums[i]) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      arr[left] = nums[i];
      position.push(left);
    }
  }
  let cur = arr.length - 1;
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      arr[cur] = i;
      cur--;
    }
  }
  return arr;
}

// leetcode -- 300. 最长递增子序列
var lengthOfLIS = function (nums) {
  const arr = [nums[0]];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
    } else {
      let left = 0;
      let right = arr.length - 1;
      while (left < right) {
        const mid = (left + right) >> 1;
        if (arr[mid] < nums[i]) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      arr[left] = nums[i];
    }
  }
  return arr.length;
};
