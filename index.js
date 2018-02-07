/* eslint no-process-exit:0 no-process-env:0 */
console.log('please wait...');
const fork = require('child_process').fork;
const path = require('path');
const nodePaths = {
    customRequest: path.join(__dirname, 'nodes', 'customRequest.js'),
    publish: path.join(__dirname, 'nodes', 'publish.js'),
    queueReply: path.join(__dirname, 'nodes', 'queueReply.js'),
    reply: path.join(__dirname, 'nodes', 'reply.js'),
    request: path.join(__dirname, 'nodes', 'request.js'),
    subscribe: path.join(__dirname, 'nodes', 'subscribe.js')
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
    customReqRes: {
        client: nodePaths.customRequest,
        server: nodePaths.reply
    },
    reqResQueue: {
        client: nodePaths.request,
        server: nodePaths.queueReply
    },
    customReqResQueue: {
        client: nodePaths.customRequest,
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
const topic = 'perf';
let producersStarted = 0;
let producers = [];
for (var i = 0; i < params.producers; i += 1) {
    let producer = fork(server, [], {
        env: {
            iterations: params.iterations,
            topic,
            id: i + 1
        }
    });
    producers.push(producer);
    producer
        .on('message', message => {
            if (message === 'ready') {
                producersStarted++;
                if (producersStarted === params.producers) {
                    fork(client, [], {
                        env: {
                            iterations: params.iterations,
                            topic
                        }
                    }).on('message', message => {
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
