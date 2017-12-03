const WebSocket = require('ws');
const http = require('http');


export default function (args) {

	let {
		proxyHost,
		proxyPort,
		hookPort,
		hookHost,
		branch,
		repository,
	} = args;

	if(/:\d+$/.test(proxyHost)){
		proxyPort=/:(\d+)$/.exec(proxyHost)[1];
		proxyHost=proxyHost.replace(/:\d+$/, '');
	}


	const ws = new WebSocket(`ws://${proxyHost}${proxyPort?(':'+proxyPort):''}`);

	ws.on('open', function open() {
	  console.log('连接服务器成功');
	  ws.send(JSON.stringify({
	  	action: 'reg',
	  	data: {
	  		branch,
			repository,
	  	},
	  }));
	});

	ws.on('error', function open(err) {
	  console.log('连接服务器失败',err);
	  process.exit(1);
	});

	ws.on('close', function open() {
	  console.log('远程服务器关闭');
	  process.exit(); //Todo 上线时 去掉
	});

	ws.on('message', function incoming(data) {
	  // console.log(data);
	  	data = JSON.parse(data);
	  	let bodyData = data.body?JSON.stringify(data.body):'';
	  	let headers = data.request.header||{};
	  	headers['Content-Length'] = Buffer.byteLength(bodyData);

	  	var options={  
		   headers,
		   hostname: hookHost,  
		   port: hookPort,  
		   path: data.request.url,  
		   method: data.method,  
		}  
		var req=http.request(options);  
		req.on('error',function(err){  
		    console.error(err);  
		});  
		req.write(bodyData);  
		req.end(); 
	});



}