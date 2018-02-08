/* eslint no-process-exit:0, no-process-env:0, no-console:0 */
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
const params = {
    iterations: parseInt(process.env.iterations) || 1000,
    producers: parseInt(process.env.producers) || 1,
    test: tests[process.env.test] ? process.env.test : 'pubsub',
    topic: process.env.topic || 'perf'
};
console.log('\n\ncontext', JSON.stringify(params, null, 4), '\n\nplease wait...\n\n');
const {client, server} = tests[params.test];
const {topic, producers, iterations} = params;
const producersStarted = new Set();
for (var i = 0; i < producers; i += 1) {
    let producer = fork(server, [], {
        env: {
            iterations,
            topic,
            id: i + 1
        }
    });
    producer
        .on('message', message => {
            if (message === 'ready') {
                producersStarted.add(producer);
                if (producersStarted.size === producers) {
                    fork(client, [], {
                        env: {
                            iterations,
                            topic
                        }
                    }).on('message', message => {
                        if (message === 'done') {
                            producersStarted.forEach(producer => producer.send('done'));
                        }
                    });
                }
            } else if (message === 'done') {
                producersStarted.delete(producer);
                if (!producersStarted.size) {
                    process.exit(0);
                }
            }
        });
};
