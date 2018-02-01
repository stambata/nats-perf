/* eslint no-process-env:0 no-console:0 */
const nats = require('nats').connect();
const msg = JSON.stringify({x: 1, y: 2, z: 3});
let iterations = parseInt(process.env.iterations);
let sent = 0;
let time;
const summarize = () => {
    let diff = process.hrtime(time);
    const ms = diff[0] * 1000 + diff[1] / 1000000;
    console.log('publish', JSON.stringify({
        sent,
        totalTime: ms + 'ms',
        mps: (sent * 1000) / ms
    }, null, 4));
};

nats.on('connect', () => {
    nats.flush(() => {
        time = process.hrtime();
        while (sent < iterations) {
            sent++;
            nats.publish('perf', msg);
        }
        summarize();
    });
});
