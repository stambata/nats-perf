exports.servers = [
    'nats://127.0.0.1:4222',
    'nats://127.0.0.1:5222',
    'nats://127.0.0.1:6222'
];

exports.msg = JSON.stringify({x: 1, y: 2, z: 3});

exports.replyMessage = 'done!';
