import React from './Core/React';
import Todo from './Component/Todo';
// import Counter from "./Component/Counter";
// <Counter name="计数器">
// {type:Counter,props:{name:'计数器'}}

let element = React.createElement(Todo, {name: 'todos'});

React.render(element, document.getElementById('root'));
