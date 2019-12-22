import React from "@/react";
import ReactDOM from "@/react-dom";
import Todo from "./Component/Todo";
// import Counter from "./Component/Counter";
// <Counter name="计数器">
// {type:Counter,props:{name:'计数器'}}

let element = React.createElement(Todo, { name: "todoList" });

ReactDOM.render(element, document.getElementById("root"));
