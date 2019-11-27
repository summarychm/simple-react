// @ts-check
/**
 * 目标: 实现一个v15版的React 库,不分离出ReactDOM
 */

/**
  虚拟DOM: 使用React.createElement()生成的对象,{type,props,...children}
  虚拟DOM分类(2+1):原生DOM元素,自定义元素,文本元素
  自定义类主要用于生命周期,其中render()负责返回渲染用的Html
  虚拟DOM差异化算法(diff algorithm)
  
  更新都是交由Unit来处理自己的更新

  */
// ReactElement JSX语法生成的元素
// 虚拟DOM

import $ from "jquery";
import Component from "./component"; // ReactElement 父类
import { createElement } from "./element"; // 创建虚拟 DOM 实例
import createReactUnit from "./unit"; // 简单工厂类实例

const React = {
	nextRootIndex: 0, // ReactComponet的标识Id,用于查找元素
	render,
	createElement,
	Component,
};

/** 将虚拟DOM挂载到真实DOM上
 * @param {object} element 要渲染的VirtualDOM(babel转义JSX后的结果)
 * @param {HTMLElement} container 要渲染到DOM元素
 * 调度流程: createReactUnit -> ReactXXXUnit -> getHtmlString -> html()
 */
function render(element, container) {
	const unitInstance = createReactUnit(element); // 根据element返回不同的组件实例
	const markUp = unitInstance.getHtmlString(React.nextRootIndex); // 组件实例对应的HTML
	$(container).html(markUp);
	$(document).trigger("mountReady"); // 通知所有Component,html已经追加到DOM中(componentDidMount)
}
export default React;
