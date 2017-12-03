// const os = require('os');
import optimist from 'optimist';
import shelljs from 'shelljs';
import fs from 'fs';
import { fork } from 'child_process';
import websocketProxyServer from './util/websocketProxyServer';
import webhookServer from './util/webhookServer';
import wechatServer from './util/wechatServer';
import isWindows from 'is-windows';

const isWin = isWindows();

const argv       = optimist
      .argv;
// console.log(argv);
// process.exit(0);

// var ifaces = os.networkInterfaces();

function showHelp() {
	 console.log([
    'usage: webhook-c [options] --start-cmd "cmd"',
    '',
    'options:',
    '  --start-cmd "exec"     应用启动运行命令，例如 "mvn spring-boot:run"、"npm start" 等  ,前后必须加上双引号，该参数必须填写',
    '  --start-cmd "exec"     停止应用命令， 例如 "tomcat stop"、"ps -ef | grep java | kill -9"',
    '  --cwd path             工作目录，默认当前目录',
    '  --ph  host:port        跳板服务器的地址（域名端口）',
    '  --p host               webhook 侦听的域名 默认 0.0.0.0',
    '  --p port               webhook 侦听的端口 默认 80',
    '  --wechat-to gNames      启动微信通知, GroupName,通知的人或群名称，可以有多个,以逗号分隔',
    '  -h --help              Print this list and exit.',
    
  ].join('\n'));
  process.exit();
}

if (argv.h || argv.help) {
 showHelp();
}

const port = argv.p || parseInt(process.env.PORT, 10) || 4000,
	cwdPath = argv.cwd || process.cwd(),
	proxyPort = argv.pp || 80,
	host = argv.a || '0.0.0.0',
	serverStartCmd = argv['start-cmd'],
	serverStopCmd = argv['stop-cmd'],
	wechatTo = argv['wechat-to'],
    proxyHost = argv.ph; // || 'git-webhook-proxy-server-front-server.193b.starter-ca-central-1.openshiftapps.com'

if(!serverStartCmd){
	showHelp();
}

if (!shelljs.which('git')) {
  shelljs.echo('Sorry, this script requires git');
  shelljs.exit(1);
}

if(!fs.existsSync('.git')){
  shelljs.echo('Sorry, current path is not git repo');
  shelljs.exit(1);
}

// shelljs.config.silent = true; // todo 

let branch = shelljs.exec('git symbolic-ref --short -q HEAD').trim();
let projectNameGitUrl = shelljs.exec('git config --get remote.origin.url').trim();
let repository = /.*\/([^\/]*).git$/.exec(projectNameGitUrl)[1];


// console.log(repository);
// process.exit();


let stopingPromise = null;


let p;
async function start() {
  if(stopingPromise){
  	await stopingPromise;
  }
  p = fork(`${__dirname}/util/startAppServer`, [serverStartCmd]);
  console.log("应用启动成功");
  return p;
}


async function stop() {
	if(stopingPromise){
		return stopingPromise;
	}
	let curP = p;
	serverStopCmd && shelljs.exec(serverStopCmd);
	if(curP.killed){
		return Promise.resolve({});
	}else{
		if(!stopingPromise){
			stopingPromise = new Promise((resolve,reject)=>{
				if(isWin){
					shelljs.exec("taskkill.exe /F /T /PID " + curP.pid);
				}else{
					shelljs.exec("kill -f -9 " + curP.pid);
				}
				setTimeout(()=>{
					stopingPromise = null;
					console.log("停止服务完成");
					resolve();
				},2000);
			});
		}
		return Promise.resolve({});
	}
}

stop.isStoping = ()=>{
	console.log(!!stopingPromise);
	if(stopingPromise){
		return true;
	}else{
		return false;
	}
}


async function pull() {
  shelljs.exec(`git clean -f`);
  shelljs.exec(`git fetch --all`);
  shelljs.exec(`git reset --hard origin/${branch}`);
  shelljs.exec(`git checkout ${branch}`);
  shelljs.exec(`git pull origin ${branch} --force`);
}


start();

let wechatCtl;


if(wechatTo){
	wechatCtl = wechatServer({
		wechatTo,
	});
}

webhookServer({
	port,
	proxyPort,
	proxyHost,
	cmder: {
		start,
		stop,
		pull,
	},
	wechatCtl,
});

if(proxyHost){
	websocketProxyServer({
		hookPort: port,
		proxyHost,
		hookHost: host==='0.0.0.0' ? 'localhost' : host,
		proxyPort,
		branch,
		repository,
	});
}



console.log("webhook启动完成，控制台请访问： http://host:port/ctrl.html");