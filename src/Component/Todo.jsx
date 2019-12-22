import React from "@/react";

export default class Todo extends React.Component {
	constructor(props) {
		super(props);
		this.state = { list: ["11", "12", "13"], text: "" };
	}
	onChange = (event) => {
		this.setState({ text: event.target.value });
	};
	handleClick = (event) => {
		console.log("handleClick", event.target);
		this.setState({
			list: [...this.state.list, this.state.text],
			text: "",
		});
	};
	onDel = (index) => {
		this.setState({
			list: [...this.state.list.slice(0, index), ...this.state.list.slice(index + 1)],
		});
	};
	render() {
		let lists = this.state.list.map((item, index) =>
			// eslint-disable-next-line implicit-arrow-linebreak
			React.createElement(
				"li",
				{},
				item,
				React.createElement(
					"button",
					{
						style: {
							backgroundColor: "red",
						},
						onClick: () => this.onDel(index),
					},
					"X",
				),
			),
		);

		let input = React.createElement("input", { onKeyup: this.onChange, value: this.state.text });
		let button = React.createElement("button", { onClick: this.handleClick }, "+");
		return React.createElement("div", {}, input, button, React.createElement("ul", {}, ...lists));
	}
}
