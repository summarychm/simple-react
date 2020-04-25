/**
  虚拟DOM: 使用React.createElement()生成的ReactElement,{type,props,...children}
  自定义类主要用于生命周期,其中render()负责返回渲染用的Html
  */

import Component from "./component"; // ReactElement 父类
import { createElement } from "../react-dom/element"; // 创建虚拟 DOM 实例

const React = {
	createElement,
	Component,
};

export default React;
