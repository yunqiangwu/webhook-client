const Koa = require('koa');
const path = require('path');
const serve = require('koa-static');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');

export default function (args) {

  const PORT = args.port || process.env.PORT || 3000;
  const { cmder } = args;
  

  const app = new Koa();

  app.use(bodyParser());

  app.use(async (ctx, next) => {

    let request = ctx.request;
      // body = ctx.request.body;

    if(ctx.request.url === "/restart" ){
      console.log("restart");  // Todo restart app server
      cmder.stop();

      // if(cmder.stop.isStoping()){
      //   ctx.body = '{"msg": "服务器正在重启"}';
      // }else{
      //   ctx.body = '{"msg": "服务器重启"}';
      //   await cmder.stop();
      //   await cmder.start();
      // }
      ctx.body = '{"msg": "服务器重启"}';
      return;
    }

    // console.log(request,ctx.request.body);
    let headers = JSON.parse(JSON.stringify(ctx.request.header).toLowerCase());
    let gitEvent = headers['x-github-event']||headers['x-gitlab-event'];
      gitEvent = gitEvent&&gitEvent.replace('hook','').trim();

    if(gitEvent === 'push'){
      await cmder.pull();
    }

    await next();

  });

  app.use(serve(path.join(__dirname,'../public')));

  const redirect = ctx => {
    ctx.response.redirect('/index.html');
    ctx.response.body = '<a href="/index.html">Index Page</a>';
  };

  app.use(route.get('/', redirect));

  global.app = app;

  app.listen(PORT);
}

  // "devDependencies": {
  //   "babel-plugin-syntax-async-functions": "^6.13.0",
  //   "babel-plugin-transform-async-to-generator": "^6.24.1",
  //   "babel-preset-es2015": "^6.24.1",
  //   "babel-preset-stage-2": "^6.24.1",
  //   "babel-register": "^6.26.0"
  // }

 //  {
 //    "presets": [
 //      "es2015",
 //      "stage-3"
 //    ],
 //    "plugins": ["syntax-async-generators","transform-async-to-generator","syntax-async-functions","transform-koa2-async-to-generator"]
 // }