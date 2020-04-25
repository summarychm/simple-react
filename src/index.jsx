import React from "@/react";
import ReactDOM from "@/react-dom";

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { count: 0 };
	}
	handleAdd = (e) => {
		console.log("add");
		this.setState({ count: this.state.count + 1 });
	};
	render() {
		return (
			<div>
				<h1>{this.props.title}</h1>
				<p>{this.state.count}</p>
				<button onClick={this.handleAdd}>Add</button>
			</div>
		);
	}
}
let element = <App title="计数器" />;
console.log(element);

ReactDOM.render(element, document.getElementById("root"));

// import React, { Component } from "react";
// import ReactDOM from "react-dom";

// function createContext() {
// 	class Provider extends React.Component {
// 		static value;
// 		constructor(props) {
// 			super(props);
// 			Provider.value = props.value;
// 			this.state = { value: props.value };
// 		}
// 		static getDerivedStateFromProps(nextProps, prevState) {
// 			Provider.value = nextProps.value;
// 			return { value: nextProps.value };
// 		}
// 		render() {
// 			return this.props.children;
// 		}
// 	}
// 	class Consumer extends React.Component {
// 		constructor(props) {
// 			super(props);
// 		}
// 		render() {
// 			return this.props.children(Provider.value);
// 		}
// 	}
// 	return {
// 		Provider,
// 		Consumer,
// 	};
// }
// // Context 可以让我们无须明确地传遍每一个组件，就能将值深入传递进组件树。
// // 为当前的 theme 创建一个 context（“light”为默认值）。
// const ThemeContext = React.createContext("light");

// class App extends React.Component {
// 	constructor() {
// 		super();
// 		this.state = {};
// 	}
// 	render() {
// 		// 使用一个 Provider 来将当前的 theme 传递给以下的组件树。
// 		// 无论多深，任何组件都能读取这个值。
// 		// 在这个例子中，我们将 “dark” 作为当前的值传递下去。
// 		return (
// 			<ThemeContext.Provider value="dark">
// 				<Toolbar />
// 			</ThemeContext.Provider>
// 		);
// 	}
// }

// // 中间的组件再也不必指明往下传递 theme 了。
// function Toolbar(props) {
// 	return (
// 		<div>
// 			<ThemeDark />
// 			<ThemedLight />
// 		</div>
// 	);
// }

// class ThemeDark extends React.Component {
// 	// 指定 contextType 读取当前的 theme context。
// 	// React 会往上找到最近的 theme Provider，然后使用它的值。
// 	// 在这个例子中，当前的 theme 值为 “dark”。
// 	static contextType = ThemeContext;
// 	render() {
// 		console.log("============ this.context begin ====================");
// 		console.log(this.context);
// 		console.log("============ this.context end ======================");
// 		return (
// 			<p onClick={() => (this.context = "light")}>
// 				ThemedLight:
// 				{this.context}
// 			</p>
// 		);
// 	}
// }
// class ThemedLight extends React.Component {
// 	static contextType = ThemeContext;
// 	render() {
// 		return (
// 			<p onClick={() => (this.context = "dark")}>
// 				ThemedDark:
// 				{this.context}
// 			</p>
// 		);
// 	}
// }
// ReactDOM.render(<App />, document.querySelector("#root"));
