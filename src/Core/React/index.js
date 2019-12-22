/**
  ReactElement: JSX语法生成的元素
  虚拟DOM: 使用React.createElement()生成的对象,{type,props,...children}
  虚拟DOM分类(2+1):原生DOM,自定义组件(Component&FC),文本
  自定义类主要用于生命周期,其中render()负责返回渲染用的Html
  虚拟DOM差异化算法(diff algorithm)
  */

import Component from "./component"; // ReactElement 父类
import { createElement } from "../react-dom/element"; // 创建虚拟 DOM 实例

const React = {
	createElement,
	Component,
};

export default React;
