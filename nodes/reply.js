/* eslint no-process-env:0 no-console:0 */
const nats = require('nats').connect();
const iterations = parseInt(process.env.iterations);
const replyMessage = 'done!';
let received = 0;
let time;
const summarize = () => {
    let diff = process.hrtime(time);
    const ms = diff[0] * 1000 + diff[1] / 1000000;
    console.log(`reply-${process.env.id}`, JSON.stringify({
        received,
        totalTime: ms + 'ms',
        mps: (received * 1000) / ms
    }, null, 4));
};

process.on('message', (message) => {
    if (message === 'done') {
        process.send(message);
    }
});

nats.on('connect', function(nc) {
    nats.subscribe('perf', function(msg, replyTo) {
        if (received++ === 0) {
            time = process.hrtime();
        } else if (received === iterations) {
            summarize();
        }
        nats.publish(replyTo, replyMessage);
    });
    process.send('ready');
});
