const WebSocket = require('ws');
const axios = require('axios');
const qs = require('querystring'); 


export default function (args) {

	let {
		hookPort,
		proxyAddress,
		hookHost,
		branch,
		repository,
	} = args;

	let ws ;

	function start() {
		ws = new WebSocket(proxyAddress);

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

		ws.on('close', function outcoming(data) {
		    // Broadcast to everyone else.
		    console.log('连接断开，正在重新连接。。。');
		    start();
		});

		ws.on('error', function error(err) {
		  console.log('连接服务器失败',err);
		  process.exit(1);
		});

		ws.on('message', function incoming(data) {
		  	data = JSON.parse(data);
		  	let headers = data.request.header||{};
			let url = `http://${hookHost}:${hookPort}${data.request.url}`
			axios.post(url,data.body,{
				headers: headers,
			});
		});	
	}
	
}