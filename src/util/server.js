const Koa = require('koa');
const path = require('path');
const serve = require('koa-static');
const route = require('koa-route');
const websockify = require('koa-websocket');
const bodyParser = require('koa-bodyparser');


const PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000

const app = websockify(new Koa());

function broadcast(data) {
  app.ws.server.clients.forEach(function each(client) {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
};

app.use(bodyParser());


app.use(async (ctx, next) => {

  let message = JSON.stringify({
  	request: ctx.request,
  	body: ctx.request.body,
  },null,2);

  if(ctx.request.url.startsWith("/hook")){
  	broadcast(message);
    console.log(message);
  	ctx.body = "{}"
  	return;
  }

  if(ctx.request.url.startsWith("/health")){
    ctx.body = "{}"
    return;
  }
  console.log(message);
  await next();
});

app.use(serve(path.join(__dirname,'public')));

const redirect = ctx => {
  ctx.response.redirect('/index.html');
  ctx.response.body = '<a href="/index.html">Index Page</a>';
};

app.use(route.get('/', redirect));

global.app = app;

app.listen(PORT);


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