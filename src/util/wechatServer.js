'use strict'
const axios = require('axios');

export default function (args) {

  const { wechatServerUrl } = args;
  
  return {
    sendMsg: (msg, wechatTo)=>{
      if(!wechatTo || !msg || !wechatServerUrl){
        return;
      }
      console.log(msg,wechatTo);

      axios.post(wechatServerUrl, {
        msg: (typeof msg === 'string') ? msg : (msg.message || JSON.stringify(msg)),
        to: wechatTo
      });
    }
  }


}