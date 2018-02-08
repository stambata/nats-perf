/* eslint no-process-env:0, no-console:0 */
const nats = require('nats').connect();
const msg = JSON.stringify({x: 1, y: 2, z: 3});
const iterations = parseInt(process.env.iterations);
const topic = process.env.topic;
let sent = 0;
let received = 0;
let time;
const summarize = () => {
    let diff = process.hrtime(time);
    const ms = diff[0] * 1000 + diff[1] / 1000000;
    console.log('request', JSON.stringify({
        sent,
        received,
        totalTime: ms + 'ms',
        mps: (sent * 1000) / ms
    }, null, 4), '\n\n');
};
const callback = function(msg) {
    received++;
    if (received === iterations) {
        summarize();
        process.send('done');
    }
};
nats.on('connect', () => {
    nats.flush(() => {
        time = process.hrtime();
        while (sent < iterations) {
            sent++;
            nats.publish(topic, msg, topic + sent, callback); // use (topic + sent) to generate custom reply channel
        }
    });
});
