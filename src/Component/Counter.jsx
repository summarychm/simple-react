import React from "../Core/react";

export default class Counter extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			number: 1,
		};
	}

	componentWillMount() {
		console.log("Counter 开始挂载!");
	}

	componentDidMount() {
		console.log("Counter 挂载完成!");
	}
	shouldComponentUpdate() {
		return true;
	}
	handleClick = () => {
		this.setState({
			number: this.state.number + 1,
		});
	};
	render() {
		return (
			<>
				<span>
					Counter:
					{this.state.number}
				</span>
				<Add handleClick={this.handleClick} />
			</>
		);
		// let pName = React.createElement("span", null, this.state.number);
		// let pCount = React.createElement("span", { style: { padding: "10px" } }, this.props.name);
		// let button = React.createElement("button", { type: "button", onClick: this.handleClick }, "+");
		// let styleObj = {
		// 	display: "inline-block",
		// 	backgroundColor: this.state.number % 2 === 0 ? "red" : "green",
		// 	color: this.state.number % 2 === 0 ? "green" : "red",
		// };
		// return React.createElement("div", { id: "counter", style: styleObj }, pCount, pName, button);
	}
}
function Add(props) {
	return (
		<>
			<button onClick={props.handleClick}>Add</button>
		</>
	);
}
