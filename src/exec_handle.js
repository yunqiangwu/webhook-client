// const os = require('os');
import optimist from 'optimist';
import shelljs from 'shelljs';
import fs from 'fs';
import { fork } from 'child_process';
import websocketProxyServer from './util/websocketProxyServer';
import webhookServer from './util/webhookServer';
import isWindows from 'is-windows';

const isWin = isWindows();

const argv       = optimist
      .boolean('cors')
      .argv;
// console.log(argv);
// process.exit(0);

// var ifaces = os.networkInterfaces();

if (argv.h || argv.help) {
  console.log([
    'usage: webhook-c [options]',
    '',
    'options:',
    '  -p           Port to use [8080]',
    '  -a           Address to use [0.0.0.0]',
    '  -d           Show directory listings [true]',
    '  -i           Display autoIndex [true]',
    '  -g --gzip    Serve gzip files when possible [false]',
    '  -e --ext     Default file extension if none supplied [none]',
    '  -s --silent  Suppress log messages from output',
    '  --cors[=headers]   Enable CORS via the "Access-Control-Allow-Origin" header',
    '                     Optionally provide CORS headers list separated by commas',
    '  -o [path]    Open browser window after starting the server',
    '  -c           Cache time (max-age) in seconds [3600], e.g. -c10 for 10 seconds.',
    '               To disable caching, use -c-1.',
    '  -U --utc     Use UTC time format in log messages.',
    '',
    '  -P --proxy   Fallback proxy if the request cannot be resolved. e.g.: http://someurl.com',
    '',
    '  -S --ssl     Enable https.',
    '  -C --cert    Path to ssl cert file (default: cert.pem).',
    '  -K --key     Path to ssl key file (default: key.pem).',
    '',
    '  -r --robots  Respond to /robots.txt [User-agent: *\\nDisallow: /]',
    '  --no-dotfiles  Do not show dotfiles',
    '  -h --help    Print this list and exit.'
  ].join('\n'));
  process.exit();
}

var port = argv.p || parseInt(process.env.PORT, 10) || 4000,
	cwdPath = argv['_'][0] || process.cwd(),
	proxyPort = argv.pp || 80,
	host = argv.a || '0.0.0.0',
    proxyHost = argv.ph; // || 'git-webhook-proxy-server-front-server.193b.starter-ca-central-1.openshiftapps.com'

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



let serverStartCmd = 'yarn start';
let serverStopCmd = 'echo stop server';
let stopingPromise = null;


let p;
async function start() {
  if(stopingPromise){
  	await stopingPromise;
  }
  p = fork(`${__dirname}/util/startAppServer`, [serverStartCmd]);
}


async function stop() {
	p.kill('SIGINT');
	return;

	if(stopingPromise){
		return;
	}
	let curP = p;
	serverStopCmd && shelljs.exec(serverStopCmd);
	if(curP.killed){
		return Promise.resolve({});
	}else{
		if(!stopingPromise){
			curP.kill('SIGINT');
			stopingPromise = new Promise((resolve,reject)=>{
				curP.on('exit', function (a) {
					setTimeout(()=>{
						stopingPromise = null;
						console.log("停止服务完成",a);
						resolve(a);
					},2000);
			  	});
			  	curP.on('error', function (err) {
					reject(err)
					stopingPromise = null;
					console.log("停止服务出错",err);
			  	});
			});
		}
		return stopingPromise
	}
}

stop.isStoping = () => !!stopingPromise;

async function pull() {
  shelljs.exec(`git clean -f`);
  shelljs.exec(`git fetch --all`);
  shelljs.exec(`git reset --hard origin/${branch}`);
  shelljs.exec(`git checkout ${branch}`);
  shelljs.exec(`git pull origin ${branch} --force`);
}




process.on('SIGINT', function () {
	fs.removeSync(tempDir);

	program.runningCommand && program.runningCommand.kill('SIGKILL');
	process.exit(0);
});




start();


webhookServer({
	port,
	proxyPort,
	proxyHost,
	cmder: {
		start,
		stop,
		pull,
	}
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



console.log("OVER");