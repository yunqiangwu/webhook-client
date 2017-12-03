


const restartBtn = document.querySelector('#restartBtn');
const restartResult = document.querySelector('#restartResult');

restartBtn.onclick = ()=>{
	showMsg('正在发送重启指令。。。');
	restartBtn.disabled = true;
	fetch('/restart').then(data=>data.json()).then((data)=>{
		showMsg(JSON.stringify(data,null,2));
		restartBtn.disabled = false;
	},(error)=>{
		showMsg(JSON.stringify(error,null,2));
		restartBtn.disabled = false;
	});

}

function showMsg(msg) {
	restartResult.innerHTML= `<pre>${msg}\n\n</pre>`
}