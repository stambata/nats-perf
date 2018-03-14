exports.servers = [
    'nats://127.0.0.1:4222',
    'nats://127.0.0.1:5222',
    'nats://127.0.0.1:6222'
];

const request = require('./request.json');
exports.msg = JSON.stringify(request);

const reply = require('./reply.json');
exports.replyMessage = JSON.stringify(reply);
