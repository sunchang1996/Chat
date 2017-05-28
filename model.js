// 操作数据库
let mongoose = require('mongoose');
mongoose.Promise=Promise;
//1.连接数据库
mongoose.connect('mongodb://localhost/Socket');

//2. 定义Schema
let MessageSchema = new mongoose.Schema({
    username:String,
    content:String,
    createAt:{type:Date,default:Date.now}
});
// 定义model 并导出
let Message = mongoose.model('Message',MessageSchema);
exports.Message = Message;