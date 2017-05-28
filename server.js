/**
 *  聊天室 页面(express) + 消息通信 (socket.io)
 */
let express = require('express');
let path = require('path');
let Message = require('./model').Message;
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
// 监听客户端的连接，当连接到来的时候执行对应的回调函数
//socket 对象是每个客户端会专属有一个
//存放着每个客户端的用户名 和 socket对象对应关系
let sockets= {};
io.on('connection',function (socket) {
    let username;
    let currentRoom; //当前的房间名
    // 当服务器端接收到客户端的消息之后执行回调函数 msg就是对应的消息
    socket.on('message',function (msg) {
        // 广播给所有人
        if(username){ // 如果已经赋值过了
            let reg = /@([^\s]+) (.+)/;
            let result =  msg.match(reg);
            if(result){ // 私聊
                //得到用户名
                let toUser = result[1];
                // 得到内容
                let content = result[2];
                socket.send({username,content,createAt:new Date().toLocaleString()});
                sockets[toUser].send({username,content,createAt:new Date().toLocaleString()})
            }else {
                Message.create({username,content:msg},function (err, message) {
                    if (currentRoom){
                        //房间内接收
                        io.in(currentRoom).emit('message',message);
                    }else {
                        // 全局接收
                        io.emit('message',message)
                    }
                })
            }
        }else {
            username= msg ;
            // 建立用户名和socket对象的对应关系
            sockets[username] = socket;
            io.emit('message',{username:'系统',content:`欢迎${username}来到聊天室`,createAt:new Date().toLocaleString()});
        }
    });
    // 服务器监听到消息 客户端向获取最近的20条数据
    socket.on('getAllMessages',function () {
        // 查询出最近的20条数据并发给客户端
        Message.find().sort({createAt:-1}).limit(20).exec(function (err, messages) {
            messages.reverse();  // 显示的时候 还是要从旧往新显示

            socket.emit('allMessages',messages);

        })
    });
    // 监听客户端想加入的房间事件
    socket.on('join',function (roomName) {
        if(currentRoom){// 如果此客户端原来在某个房间内，则让他离开那个房间
            socket.leave(currentRoom);
        }
        // 让socket 进入对应的房间
        socket.join(roomName);
        currentRoom = roomName ;
    });
    // 监听客户端想要删除某个消息的事件
    socket.on('delete',function (id) {
        Message.remove({_id:id},function (err, result) {
            io.emit('deleted',id);
        })
    })
});

server.listen(8080);