/* eslint no-process-exit:0 no-process-env:0 */
console.log('please wait...');
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
    producers: 1,
    test: 'pubsub'
}, {
    iterations: parseInt(process.env.iterations) || undefined,
    producers: parseInt(process.env.producers) || undefined,
    test: process.env.test
});
const {client, server} = tests[params.test];
let producersStarted = 0;
let producers = [];
for (var i = 0; i < params.producers; i += 1) {
    let producer = fork(server, [], {env: {iterations: params.iterations, id: i + 1}});
    producers.push(producer);
    producer
        .on('message', message => {
            if (message === 'ready') {
                producersStarted++;
                if (producersStarted === params.producers) {
                    fork(client, [], {env: {iterations: params.iterations}})
                        .on('message', message => {
                            if (message === 'done') {
                                producers.map(producer => producer.send('done'));
                            }
                        });
                }
            } else if (message === 'done') {
                if (!--producersStarted) {
                    process.exit(0);
                }
            }
        });
};
