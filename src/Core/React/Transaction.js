// 事务包装器(用于在指定事件前后执行code)
export default class Transaction {
  constructor(wrappers) {
    this._wrappers = (wrappers instanceof Array) ? [wrappers] : wrappers;
  }

  perform(anyMethod) {
    this._wrappers.forEach((wrapper) => wrapper.initialize());
    anyMethod();
    this._wrappers.forEach((wrapper) => wrapper.close());
  }
}
