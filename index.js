/* eslint no-process-exit:0 no-process-env:0 */
const fork = require('child_process').fork;
const path = require('path');
const nodePaths = {
    subscribe: path.join(__dirname, 'nodes', 'subscribe.js'),
    publish: path.join(__dirname, 'nodes', 'publish.js'),
    request: path.join(__dirname, 'nodes', 'request.js'),
    reply: path.join(__dirname, 'nodes', 'reply.js'),
    queueReply: path.join(__dirname, 'nodes', 'queueReply.js')
};
const tests = {
    pubSub: {
        client: nodePaths.publish,
        server: nodePaths.subscribe
    },
    reqRes: {
        client: nodePaths.request,
        server: nodePaths.reply
    },
    reqResQueue: {
        client: nodePaths.request,
        server: nodePaths.queueReply
    }
};
const params = Object.assign({
    iterations: 1000,
    consumers: 1,
    test: 'pubsub'
}, {
    iterations: parseInt(process.env.iterations) || undefined,
    consumers: parseInt(process.env.consumers) || undefined,
    test: process.env.test
});
const {client, server} = tests[params.test];
let consumersStarted = 0;
let consumers = [];
for (var i = 0; i < params.consumers; i += 1) {
    let consumer = fork(server, [], {env: {iterations: params.iterations, id: i + 1}});
    consumers.push(consumer);
    consumer
        .on('message', message => {
            if (message === 'ready') {
                consumersStarted++;
                if (consumersStarted === params.consumers) {
                    fork(client, [], {env: {iterations: params.iterations}})
                        .on('message', message => {
                            if (message === 'done') {
                                consumers.map(consumer => consumer.send('done'));
                            }
                        });
                }
            } else if (message === 'done') {
                if (!--consumersStarted) {
                    process.exit(0);
                }
            }
        });
};
