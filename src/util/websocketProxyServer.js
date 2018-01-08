const WebSocket = require('ws');
const axios = require('axios');
const qs = require('querystring'); 


let hartboomTid = null;
let hartboomSec = 60000;
let errTryCount = 0;
const errTryCountLen = 10;
let isConnect = false;

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
		  isConnect = true;
		});

		ws.on('close', function outcoming(data) {
			isConnect = false;
		    // Broadcast to everyone else.
		    console.log('连接断开，正在重新连接。。。');
		    if(hartboomTid){
				clearInterval(hartboomTid);
				hartboomTid = null;
			}
		    setTimeout(start,1000);
		    // start();
		});

		ws.on('error', function error(err) {
			isConnect = false;
			errTryCount++;
		  console.log('连接服务器失败',err);
		  if(hartboomTid){
			clearInterval(hartboomTid);
			hartboomTid = null;
		  }
		  if(errTryCount<errTryCountLen){
		  	setTimeout(start,1000);
		  }else{
		  	process.exit(1);
		  }
		});

		ws.on('message', function incoming(data) {
		  	data = JSON.parse(data);
		  	let headers = data.request.header||{};
			let url = `http://127.0.0.1:${hookPort}${data.request.url}`
			axios.post(url,data.body,{
				headers: headers,
			});
		});

		if(hartboomTid){
			clearInterval(hartboomTid);
			hartboomTid = null;
		}
		hartboomTid = setInterval(()=>{
			if(!isConnect){
				console.log('还没有连接服务器：'+ new Date());
				return;
			}
			ws.send(JSON.stringify({
			  	action: 'hartboom',
			  	t: new Date().getTime(),
			  }));
			console.log('发送心跳：'+ new Date());
		},hartboomSec);
	}

        start();
	
}
