const Koa = require('koa');
const path = require('path');
const serve = require('koa-static');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');

let p ;
let wechatTo = process.env.WECHAT_TO || 'Wayne';

export default function (args) {

  const {
    wechatCtl,
    host,
    branch,
  } = args;

  const PORT = args.port || process.env.PORT || 8008;
  const { cmder } = args;
  const app = new Koa();

  app.use(bodyParser());

  app.use(async (ctx, next) => {

    let request = ctx.request;
      // body = ctx.request.body;

    if(ctx.request.url === "/restart" ){
      if(cmder.stop.isStoping()){
        ctx.body = '{"msg": "服务器正在重启"}';
      }
      else{
        ctx.body = '{"msg": "服务器重启"}';
        await cmder.stop();
        p = cmder.start();
        p.on('error',(message)=>{
            wechatCtl.sendMsg(message, wechatTo);
        });
      }

      if(wechatCtl){
        let msg = ctx.body;
        wechatCtl.sendMsg(msg, wechatTo);
     }

      return;
    }

     if(ctx.request.url.startsWith("/hook") ){
      let headers = JSON.parse(JSON.stringify(ctx.request.header).toLowerCase());
      let gitEvent = headers['x-github-event']||headers['x-gitlab-event'];
        gitEvent = gitEvent&&gitEvent.replace('hook','').trim();
        console.log(ctx.request.body);
      if(gitEvent === 'push'){
         if(wechatCtl){
            let pushData = ctx.request.body.payload ? JSON.parse(ctx.request.body.payload) : ctx.request.body;
            let commitObj = pushData.head_commit || pushData.commits[0];
            let pusher = commitObj.author.name;
            let commitMsg =  commitObj.message;
            let diffMsg = '';
            if(commitObj.added && commitObj.added.length){
              diffMsg += "添加文件：" + commitObj.added.join(' , ')+'\n';
            }
            if(commitObj.modified && commitObj.modified.length){
              diffMsg += "修改文件：" + commitObj.modified.join(' , ')+'\n';
            }
            if(commitObj.commitMsg && commitObj.commitMsg.length){
              diffMsg += "删除文件：" + commitObj.commitMsg.join(' , ')+'\n';
            }

            let msg =`${pusher} 提交修改到 ${branch} 分支，文件变动如下

${diffMsg}
提交的注释：${commitMsg}

服务器已经自动pull了代码。
如果此次修改不支持热更新，可以打开 http://${host==='0.0.0.0'?('{服务器ip}'):(host)}:${PORT}/ctrl.html 重启服务
            `;
            wechatCtl.sendMsg(msg, wechatTo);
         }
         cmder.pull();
      }
      ctx.body = '{"msg": "client收到hook请求"}';
      return;
     }

     if(wechatCtl && ctx.request.url=="/notice" ){
        let msg =ctx.request.body;
        msg = JSON.stringify(msg);
        wechatCtl.sendMsg(msg);
        ctx.body = '{"msg": "消息转发微信"}';
        return;
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