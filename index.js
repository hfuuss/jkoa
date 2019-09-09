const Jkoa = require('./jkoa')

const app = new Jkoa()

app.use(async (ctx, next) => {
  console.log('中间件函数1111')
  await next()
  console.log('中间件函数1111end')
})
app.use(async(ctx, next) => {
  console.log('中间件函数2222')
  // 获取请求头信息
  console.log(ctx.headers);
  // 获取查询字符串参数
  console.log(ctx.query);
  // 设置响应头信息
  ctx.set('content-type', 'text/html;charset=utf-8');
  // 设置响应内容，由框架负责返回响应~
  ctx.body = '<h1>hello myKoa</h1>';
})

app.listen(3000,err => {
  if (err) console.log(err)
  else console.log('服务器启动了')
})