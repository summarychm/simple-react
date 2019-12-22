// Unit 实例私有属性(this指向unit实例)
// this._reactId 元素reactId
// this._currentElement 当前虚拟DOM元素
// this._renderedChildrenUnits 当前元素children的unit实例集合
// this._componentInstance 复合组件Component实例,并将当前unit存入_currentUnit属性(双向指向)
// this._renderedUnitInstance 复合元素render返回值(虚拟DOM)对应的unit类实例

import $ from "jquery";
import { ReactElement } from "./element";

let diffQueue = []; // 差异队列(先比较,比较完成后才更新)
let updateDepth = 0; //! 当前diff深度,当再次变为0时说明本次diff完成.
// diff的几种类型
const types = {
	MOVE: "MOVE", // 移动
	INSERT: "INSERT", // 插入
	REMOVE: "REMOVE", // 删除
};

// 负责渲染界面,将React元素转为可在页面上显示的html字符串
class Unit {
	constructor(element) {
		// element的 props 如果应用于 dom 元素则作用于其属性,如果应用于自定义组件则充当起 props.
		this._currentElement = element;
		this._reactId = null;
	}
	// 返回虚拟 DOM 对应的html 字符串
	getHtmlString(reactId) {
		throw new Error("子类需自行实现!");
	}
	// 组件自身更新方法(setState)
	update(nextElement, par) {
		throw new Error("子类需自行实现!");
	}
}

/** 文本/数字元素的Unit类 */
class TextUnit extends Unit {
	/** 返回虚拟 DOM 对应的html 字符串 */
	getHtmlString(reactId) {
		this._reactId = reactId; // 缓存组件的react-id
		return `<span data-reactid="${this._reactId}">${this._currentElement}</span>`;
	}

	/** 文本组件更新:只需对比新旧内容是否一致
	 * @param {Object} nextReactElement 新的虚拟DOM
	 * @param {Object} partialState 部分更新的的state
	 * 原生DOM和文本组件只传递第一个参数，因为他们没有state
	 */
	update(nextElement) {
		// 判断新旧两个文本节点内容是否一致,不一致则更新
		if (this._currentElement !== nextElement) {
			this._currentElement = nextElement;
			$(`[data-reactid="${this._reactId}"]`).html(this._currentElement);
		}
	}
}

/** 原生 DOM 的Unit类 */
class NativeUnit extends Unit {
	/** 返回虚拟 DOM 对应的html 字符串 */
	getHtmlString(reactId) {
		this._reactId = reactId; // 更新标识Id
		const { type, props } = this._currentElement;
		let tagStart = `<${type}`;
		const tagIgnore = ["img", "input"]; // 无需closg的tag.
		const tagEnd = `</${!tagIgnore.includes(type) ? type : ""}>`;
		let childString = ""; // 子组件DOMString
		this._renderedChildrenUnits = []; // 缓存childrenUnit集合,用于setState时复用旧Unit元素
		tagStart += ` data-reactid="${this._reactId}"`; // 加上标识Id

		for (const propKey in props) {
			if (!props.hasOwnProperty(propKey)) continue;

			if (/^on[A-Za-z]/.test(propKey)) {
				const eventName = propKey.slice(2).toLowerCase();
				const eventHandle = props[propKey];
				const selector = `[data-reactid="${this._reactId}"]`;
				const eventType = `${eventName}.${this._reactId}`;
				//! 将事件委托到 document上,用_reactId作为命名空间
				$(document).delegate(selector, eventType, eventHandle);
			} else if (propKey === "style") {
				let styleStr = "";

				for (const [attr, value] of Object.entries(props[propKey])) {
					// 将驼峰式命名改为"短横线隔开式"
					styleStr += `${attr.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value};`;
				}
				tagStart += ` style="${styleStr}"`;
			} else if (propKey === "children") {
				const children = props[propKey]; // 获取子节点Element
				childString = children
					.map((ele, idx) => {
						const childUnitInstance = createReactUnit(ele); // 获取子元素的Unit实例
						if (!childUnitInstance) return "";
						childUnitInstance._mountIndex = idx; //! 子元素的挂载索引(在父节点中的索引)
						//! 缓存子元素unit到父节点的_renderedChildrenUnits属性
						this._renderedChildrenUnits.push(childUnitInstance);
						// 返回children的Html
						return childUnitInstance.getHtmlString(`${this._reactId}.${idx}`);
					})
					.join("");
			} else if (propKey === "htmlFor") tagStart += ` for=${props[propKey]}`;
			else if (propKey === "className") tagStart += ` class=${props[propKey]}`;
			else tagStart += ` ${propKey}=${props[propKey]}`;
		}
		return `${tagStart}>${childString}${tagEnd}`;
	}

	/** 虚拟DOM更新:只关注自身及其子元素属性有无变化.
	 * 原生DOM和文本组件只传递第一个参数，因为他们没有state
	 * @param {Object} nextReactElement 新的虚拟DOM
	 * @param {Object} partialState 部分更新的的state
	 * 子节点 diff -> patch
	 */
	update(nextElement) {
		const oldProps = this._currentElement.props; // 旧props
		const newProps = nextElement.props; // 新props

		// this._currentElement = nextElement; // 更新虚拟DOM

		this._updateDOMProperties(oldProps, newProps); // 1.更新DOM自身属性
		this._updateChildren(newProps.children); //! 2.更新子节点
	}

	/** 对比新旧props,更新DOM自身属性
	 * @param {object} oldProps 旧 props
	 * @param {object} newProps 新 props
	 */
	_updateDOMProperties(oldProps, newProps) {
		let propKey;
		const $ReactDOM = $(`[data-reactid="${this._reactId}"]`); // 虚拟DOM对应的真实的DOM节点

		// 先清除差异,再更新.
		for (propKey in oldProps) {
			// 删除newProps中存在而oldProps中不存在的属性
			if (!newProps.hasOwnProperty(propKey)) $ReactDOM.removeAttr(propKey);
			// 删除所有的事件监听(取消委托,通过命名空间删除)
			if (/^on[A-Za-z]/.test(propKey)) {
				// let eventType = propKey.replace("on", "");
				// $(document).undelegate(`[data-reactid="${this._reactId}"]`, eventType, oldProps[propKey]);
				$(document).undelegate(`.${this._reactid}`);
			}
		}

		// 循环newProps集合,添加属性并重新绑定DOM事件
		for (propKey in newProps) {
			// children较为复杂,单独处理
			if (propKey === "children") continue;
			else if (propKey === "className") $ReactDOM.attr("class", newProps[propKey]);
			else if (propKey === "htmlFor") $ReactDOM.attr("for", newProps[propKey]);
			// 重新绑定的DOM事件
			else if (/^on[A-Za-z]/.test(propKey)) {
				const eventType = propKey.slice(2).toLowerCase();
				// $(document).on(`${eventType}.${this._reactId}`, `[data-reactid="${this._reactId}"]`, newProps[propKey]);
				$(document).delegate(`[data-reactid="${this._reactId}"]`, `${eventType}.${this._reactId}`, newProps[propKey]);
				// 处理style
			} else if (propKey === "style") {
				for (const [attr, value] of Object.entries(newProps[propKey])) {
					$ReactDOM.css(attr, value); // TODO 可以改为批量更新css?
				}
				// 更新DOM对象的常规属性
			} else $ReactDOM.prop(propKey, newProps[propKey]);
		}
	}

	/** 更新子元素(对比新旧虚拟 DOM集合)
	 * @param {Array} newChildrenElements 新children集合
	 */
	_updateChildren(newChildrenElements) {
		updateDepth++; // 更新diff层级
		this._diff(diffQueue, newChildrenElements);
		updateDepth--; // 更新diff层级

		//! 当处理回最底层时,应用补丁包
		if (updateDepth === 0 && diffQueue.length) {
			this._patch(diffQueue); // 应用补丁包
			diffQueue = []; // 清空补丁包
		}
	}

	/** 递归children找出差别,组装差异对象(inster/move/remove),添加到更新队列diffQueue。
	 * @param {Array} newChildrenElements 新children集合
	 */
	_diff(diffQueue, newChildrenElements) {
		const $ReactDOM = $(`[data-reactid="${this._reactId}"]`); // 记录父节点DOM对象
		// 1. 构建oldChildrenUnit集合,用于判断新虚拟DOM能否继续使用旧元素的unit实例
		const oldChildrenUnitMap = this.getChildrenUnitMap(this._renderedChildrenUnits);
		// 2. 获取newChildren对应的Unit集合(尽量复用旧元素的unit),并更新DOM
		const { newChildrenUnitMap, newChildrenUnitAry } = this.getNewChildrenUnits(oldChildrenUnitMap, newChildrenElements);

		//! 3. 记录上一个已经确定位置的索引.
		let lastIndex = 0;
		// 4. 对比新旧childrenUnit集合,记录elementDiff变化(inster,move)
		for (let i = 0; i < newChildrenUnitAry.length; i++) {
			const newUnit = newChildrenUnitAry[i];
			const newKey = (newUnit._currentElement.props && newUnit._currentElement.props.key) || i.toString();
			const oldUnit = oldChildrenUnitMap[newKey];

			//! 4.1 新unit在旧unit中存在,
			if (oldUnit === newUnit) {
				// 对比位置看是否需要添加move补丁
				if (oldUnit._mountIndex < lastIndex) {
					// 4.1.1 如果挂载点索引小于lastIndex则向后位移到i(move补丁)
					diffQueue.push({
						type: types.MOVE,
						parentId: this._reactId,
						parentNode: $ReactDOM,
						fromIndex: oldUnit._mountIndex,
						toIndex: i,
					});
				}
				// 更新lastIndex为mountIndex和lastIndex的较大值
				lastIndex = Math.max(lastIndex, oldUnit._mountIndex);
			} else {
				//! 4.2 newUnit在oldUnit中不存在(inster补丁)
				if (oldUnit) {
					// 4.2.1 应对新旧unit的类型不一致的情况(remove补丁)
					diffQueue.push({
						type: types.REMOVE,
						parentId: this._reactId,
						parentNode: $ReactDOM,
						fromIndex: oldUnit._mountIndex,
					});
					// 删除该节点对应unit对象
					this._renderedChildrenUnits = this._renderedChildrenUnits.filter((child) => child !== oldUnit);
					$(document).undelegate(`.${oldUnit._reactId}`); // 删除该节点的事件委托
				}
				// 4.2.2 类型一致(insert补丁)
				diffQueue.push({
					type: types.INSERT,
					parentId: this._reactId,
					parentNode: $ReactDOM,
					// fromIndex: lastIndex,
					toIndex: i,
					getHtmlString: newUnit.getHtmlString(`${this._reactId}.${i}`),
				});
			}
			newUnit._mountIndex = i; // 更新newUnit的挂载点位置
		}
		// 5. 遍历oldChildrenUnits集合,记录elementDiff变化(remove)
		for (const oldKey in oldChildrenUnitMap) {
			const oldUnit = oldChildrenUnitMap[oldKey];
			// 5.1 如果新集合中不存在旧unit,则添加remove补丁
			if (!newChildrenUnitMap.hasOwnProperty(oldKey)) {
				diffQueue.push({
					// remove补丁
					type: types.REMOVE,
					parentId: this._reactId,
					parentNode: $ReactDOM,
					fromIndex: oldUnit._mountIndex,
				});
				// 5.2 同时删除该节点对应unit对象
				this._renderedChildrenUnits = this._renderedChildrenUnits.filter((child) => child !== oldUnit);
				// 5.3 同时删除该节点的事件委托
				$(document).undelegate(`.${oldUnit._reactId}`);
			}
		}
	}
	/** 将UnitAry转换为UnitMap,key使用原有key|idx.
	 * @param {Array} childrenUnitAry 子节点UnitAry
	 */
	getChildrenUnitMap(childrenUnitAry = []) {
		const childrenUnitMap = {};
		for (let i = 0; i < childrenUnitAry.length; i++) {
			const unit = childrenUnitAry[i];
			//! 获取unit对应的虚拟DOM上的key属性,如不存在则用索引替代
			const key = (unit._currentElement.props && unit._currentElement.props.key) || i.toString();
			childrenUnitMap[key] = unit;
		}
		return childrenUnitMap;
	}

	/** 获取新的虚拟DOMAry(不记录key)和虚拟DOMMap(记录key),并更新DOM
	 * !只考虑元素属性变化,不考虑元素自身的增/删/位移(通过补丁包解决)
	 * @param {Object} oldChildrenUnitMap 旧children虚拟 DOM
	 * @param {Array} newChildrenElementAry 新children 虚拟 DOM
	 */
	getNewChildrenUnits(oldChildrenUnitMap, newChildrenElementAry) {
		const newChildrenUnitAry = []; // 记录childrenUnit数组(不保留key)
		const newChildrenUnitMap = {}; // 记录childrenUnitMap(保留原始key)
		// 以新虚拟DomAry为基准,生成新虚拟dom的Ary & Map 集合 (尽量复用old虚拟DOM)
		newChildrenElementAry.forEach((newElement, idx) => {
			// 1. 获取新虚拟DOM的key,优先使用自身key,其次idx
			const newKey = (newElement.props && newElement.props.key) || idx.toString();
			// 2. 根据newKey尝试从老Unit集合中获取unit实例
			const oldChildUnit = oldChildrenUnitMap[newKey];
			// 3. 如果找到unit实例的话,获取挂载在其上的旧虚拟DOM
			const oldElement = oldChildUnit && oldChildUnit._currentElement;
			// 4. 比较新旧虚拟DOM,看是否可以复用
			if (shouldDeepCompare(oldElement, newElement)) {
				// 4.1 交由元素自身update,生成可用的element(可能递归)
				oldChildUnit.update(newElement);
				// 4.2 复用旧的unit实例
				newChildrenUnitAry.push(oldChildUnit);
				newChildrenUnitMap[newKey] = oldChildUnit;
			} else {
				// 5. 无法复用则构建新的unit对象
				const newUnit = createReactUnit(newElement);
				newChildrenUnitAry.push(newUnit);
				newChildrenUnitMap[newKey] = newUnit;
				this._renderedChildrenUnits[idx] = newUnit; // 更新纯在的unit对象
			}
		});
		return {
			newChildrenUnitMap,
			newChildrenUnitAry,
		};
	}

	//! 根据补丁包打补丁应用更新
	_patch(diffQueue) {
		console.log("应用补丁包", diffQueue);
		const deleteChildren = []; // 存放要删除的节点
		const deleteMap = {}; // 存放待删除DOM节点集合(用于move补丁时可以复用该DOM节点)

		//! 采用二级结构,防止父子二级元素同时修改一索引导致子元素覆盖父元素
		// 1.应用move/remove补丁(删除DOM元素).
		for (let i = 0; i < diffQueue.length; i++) {
			const difference = diffQueue[i]; // 获取差异
			// 1.1 依据move/remove补丁包,将要删除的元素缓存到集合中
			if (difference.type === types.MOVE || difference.type === types.REMOVE) {
				const { fromIndex } = difference;
				const oldChild = $(difference.parentNode.children().get(fromIndex));
				//! 将父元素的reactId作为一级key,自身索引作为二级key
				if (!deleteMap[difference.parentId]) deleteMap[difference.parentId] = {};
				deleteMap[fromIndex] = oldChild;
				deleteChildren.push(oldChild);
			}
		}
		// 1.2 将待删除dom节点从真实domTree中删除.
		$.each(deleteChildren, (idx, item) => $(item).remove());

		// 2. 应用insert/move补丁,move时复用旧的DOM节点,insert时重新创建dom节点
		for (let i = 0; i < diffQueue.length; i++) {
			const difference = diffQueue[i];
			switch (difference.type) {
				case types.INSERT: // 2.1 创建新的DOM节点,并将其追加到children的指定索引位置
					this.insertChildAt(difference.parentNode, difference.toIndex, $(difference.getHtmlString));
					break;
				case types.MOVE: // 2.2 从已删除集合中取出DOM元素,追加到新索引位置(二级结构)
					const node = deleteMap[difference.parentId][difference.fromIndex];
					this.insertChildAt(difference.parentNode, difference.toIndex, node);
					break;
				default:
					break;
			}
		}
	}

	// 将html插入到指定索引
	insertChildAt(parentNode, index, htmlString) {
		const newNode = $(htmlString); // 将htmlStr转为node对象
		// 看指定索引位置上是否有元素.如果有则插入到当前元素之前,如果没有则追加到父元素下.
		const oldChild = parentNode.children().get(index);
		oldChild ? newNode.insertBefore(oldChild) : newNode.appendTo(parentNode);
	}
}

/** 自定义React组件Unit类 */
class ComponsiteUnit extends Unit {
	/** 返回虚拟 DOM 对应的html 字符串,由render()返回的ReactElement决定的 */
	getHtmlString(reactId) {
		this._reactId = reactId;
		const { type: Component, props } = this._currentElement;
		/** 自定义组件的类实例,将props作为参数传入 */
		this._componentInstance = new Component(props);
		//! Componet实例和Unit实例(双向指向),方便domDiff获取值
		this._componentInstance._currentUnit = this;
		// lifeCycle componentWillMount
		this._componentInstance.componentWillMount && this._componentInstance.componentWillMount();

		// 获取要渲染的虚拟DOM对象(babel转译JSX后的结果)
		const renderElement = this._componentInstance.render();
		// 获取renderElement的Unit实例
		const renderUnitInstance = createReactUnit(renderElement);
		/** RenderElementUnit实例 */
		this._renderedUnitInstance = renderUnitInstance;
		// 4.获取unit实例上的HtmlStr
		const renderMarkUp = renderUnitInstance.getHtmlString(this._reactId);
		//! 5.注册html挂载到页面后的回调
		$(document).on("mountReady", () => {
			// 5.1 lifeCycle componentDidMount
			this._componentInstance.componentDidMount && this._componentInstance.componentDidMount();
		});
		return renderMarkUp;
	}

	/** 自定义组件更新
	 * 原生DOM和文本组件只传递第一个参数，因为他们没有state
	 * 自定义类一般只传第二个参数,有时也会传递第一个参数
	 * @param {Object} nextReactElement 新的虚拟DOM
	 * @param {Object} partialState 部分更新的的state
	 */
	update(nextReactElement, partialState) {
		// 合并state,获取最新的state & props.
		// 执行shouldComponentUpdate判断是否继续更新
		// 基于新state和props生成新VirtualDOM,和挂载在this上的旧VirtualDOM进行对对比,是否需要对比更新.
		// 如不需要则直接渲染新DOM替换旧DOM
		// 如需要,则调用对应component类的update方法,让其自行对比更新(递归调用update).

		// ? 如果接收了新的元素，就使用新的element否则用旧的
		this._currentElement = nextReactElement || this._currentElement;

		// 把要更新的state合并到this.state上
		const nextState = { ...this._componentInstance.state, ...partialState };
		this._componentInstance.state = nextState; // 更新state
		const nextProps = this._currentElement.props; // 获取新 props.

		const { shouldComponentUpdate, componentWillUpdate } = this._componentInstance;
		// lifeCycle shouldComponentUpdate 组件是否进行更新
		if (shouldComponentUpdate && !shouldComponentUpdate(nextProps, nextState)) return;
		// lifeCycle componentWillUpdate
		componentWillUpdate && componentWillUpdate(nextProps, nextState);

		//! 下面要进行比较更新
		// 获取上次渲染的元素
		const preRenderedElement = this._renderedUnitInstance._currentElement;
		// 根据新state和新props获取新的虚拟DOM
		const nextRenderElement = this._componentInstance.render();
		// 判断是否要对比更新还是重新渲染
		if (shouldDeepCompare(preRenderedElement, nextRenderElement)) {
			// 自身不更新,交由render的unit实例对比更新,最终会由文本/原生DOM 的Unit进行diff-update
			this._renderedUnitInstance.update(nextRenderElement);
			// lifeCycle componentDidUpdate
			this._componentInstance.componentDidUpdate && this._componentInstance.componentDidUpdate();
		} else {
			// 不需要对比(两种element),直接渲染替换
			// 根据新Element创建Unit实例,并更新this._renderedUnitInstance
			this._renderedUnitInstance = createReactUnit(nextRenderElement);
			const newHtmlString = this._renderedUnitInstance.getHtmlString(this._reactId);
			// 替换整个节点
			$(`[data-reactid="${this._reactId}"]`).replaceWith(newHtmlString);
		}
	}
}

/** 对比2个虚拟DOM元素,判断是否需要深度对比(类型是否一致)
 * @param {Object} prevElement 旧虚拟DOM
 * @param {Object} nextElement 新虚拟DOM
 */
function shouldDeepCompare(prevElement, nextElement) {
	// 任何一方为空,不用深比较.
	if (!prevElement || !nextElement) return false;
	const oldType = typeof prevElement;
	const newType = typeof nextElement;
	// 如果是文本/数组类型,进行深比较.
	if ((oldType === "string" || oldType === "number") && (newType === "string" || newType === "number")) {
		return true;
	}
	// 如果是原生/自定义类型则判断类型是否相同,相同则进行深比较.
	if (prevElement instanceof ReactElement && nextElement instanceof ReactElement) {
		// 对比type和key
		return prevElement.type === nextElement.type; // && prevElement.key === nextElement.key;
	}
	return false;
}

/** 根据element类型返回不同的组件实例
 * @Tips:工厂方法(横向扩展,屏蔽差异) 新增React类型只需在此添加判断,并创建对应的 Unit子类即可.
 * @param {any} element React组件实例
 */
function createReactUnit(element) {
	// 类型一: 文本节点
	if (typeof element === "number" || typeof element === "string") return new TextUnit(element);

	// 类型二: 原生 DOM 节点
	if (element instanceof ReactElement && typeof element.type === "string") return new NativeUnit(element);

	// 类型三: React 自定义组件(其type为function)
	if (element instanceof ReactElement && typeof element.type === "function") return new ComponsiteUnit(element);

	return console.error("没有找到对应的子类!");
}

export default createReactUnit;
