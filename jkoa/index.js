const { createServer } = require('http');
const context = require('./jcontext');
const request = require('./jrequest');
const response = require('./jresponse');

module.exports = class Application {
  constructor() {
    this.middleware = [];
    // Object.create(target) 以target对象为原型, 创建新对象, 新对象原型有target对象的属性和方法
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
  }

  use(fn) {
    this.middleware.push(fn);
  }

  listen(...args) {
    // 使用nodejs的http模块监听端口号
    const server = createServer(this.callback());
    server.listen(...args);
  }

  callback() {
    const fn = compose(this.middleware);

    const handleRequest = (req, res) => {
      // 创建context
      const ctx = this.createContext(req, res);
      const handleResponse = () => respond(ctx);
      fn(ctx).then(handleResponse);
    }

    return handleRequest;
  }

  /**
   * 创建context 上下文对象的方法
   * @param req node原生req对象
   * @param res node原生res对象
   */
  createContext(req, res) {
    /*
      凡是req/res，就是node原生对象
      凡是request/response，就是自定义对象
      这是实现互相挂载引用，从而在任意对象上都能获取其他对象的方法
     */
    const context = Object.create(this.context);
    const request = context.request = Object.create(this.request);
    const response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;

    return context;
  }
}

function compose(middleware) {
  // compose方法返回值是一个函数，这个函数返回值是一个promise对象
  // 当前函数就是调度
  return (ctx) => {
    // 默认调用一次，为了执行第一个中间件函数
    return dispatch(0);
    function dispatch(i) {
      let fn = middleware[i];
       // 如果最后一个中间件也调用了next方法，直接返回一个成功状态的promise对象
      if (!fn) return Promise.resolve();
      /*
       dispatch.bind(null, i + 1)) 作为中间件函数调用的第三个参数，其实就是对应的next
         举个栗子：如果 i = 0  那么 dispatch.bind(null, 1))  
           --> 也就是如果调用了next方法 实际上就是执行 dispatch(1) 
             --> 它利用递归重新进来取出下一个中间件函数接着执行
       fn(req, res, dispatch.bind(null, i + 1))
         --> 这也是为什么中间件函数能有三个参数，在调用时我们传进来了
     */
      return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)));
    }
  }
}

function respond(ctx) {
  let body = ctx.body;
  const res = ctx.res;
  if (typeof body === 'object') {
    body = JSON.stringify(body);
    res.end(body);
  } else {
    res.end(body);
  }
}
