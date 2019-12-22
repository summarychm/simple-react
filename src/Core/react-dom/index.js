import $ from "jquery";
import createReactUnit from "./unit"; // 简单工厂类实例

/** 将虚拟DOM挂载到真实DOM上
 * @param {any} element 要渲染的VirtualDOM(babel转义JSX后的结果)
 * @param {HTMLElement} container 要渲染到DOM元素
 * 调度流程: createReactUnit -> ReactXXXUnit -> getHtmlString -> html()
 */
function render(element, container) {
	const unitInstance = createReactUnit(element); // 根据element返回不同的组件实例
	const markUp = unitInstance.getHtmlString(0); // 组件实例对应的HTML
	$(container).html(markUp);
	$(document).trigger("mountReady"); // 通知所有Component,html已经追加到DOM中(componentDidMount)
}

export default {
	render,
};
