/**
 *  聊天室 页面(express) + 消息通信 (socket.io)
 */
let express = require('express');
let path = require('path');
// express 是一个函数，调用后会返回一个HTTP的监听函数
let app = express();
// 把node_modules 作为静态文件根目录
app.use(express.static(path.resolve('./node_modules')));
// 当客户端通过GET方式访问/ 路径的时候，服务器返回index.html文件
app.get('/',function (req, res) {
   res.sendFile(path.resolve('index.html'));
});
// 创建一个HTTP 服务器
let server = require('http').createServer(app);
// 创建一个IO，并且把server作为参数传入进来
let io = require('socket.io')(server);
//
let sockets= {};
io.on('connection',function (socket) {
    let username;
    // 当服务器端接收到客户端的消息之后执行回调函数 msg就是对应的消息
    socket.on('message',function (msg) {
        // 广播给所有人
        if(username){
            let reg = /@([^\s]+) (.+)/;
            let result =  msg.match(reg);
            if(result){ // 私聊
                //得到用户名
                let toUser = result[1];
                // 得到内容
                let content = result[2];
                socket[toUser].send({username,content,createAt:new Date().toLocaleString()})
                sockets[toUser].send({username,content,createAt:new Date().toLocaleString()})
            }else {
                 io.emit('message',{username,content:msg,createAt:new Date().toLocaleString()})
            }
        }else {
            username= msg ;
            // 建立用户名和socket对象的对应关系
            sockets[username] = socket;
            io.emit('message',{username:'系统',content:`欢迎${username}来到聊天室`,createAt:new Date().toLocaleString()});
        }
    })
});

server.listen(8080);