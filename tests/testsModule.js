'use strict'
module.exports.simple = () => {
    return 'Simple test complete!';
}
module.exports.echo = (message) => {
    return new Promise((resolve, _) => {
        resolve(`Echo message: '${message}' test complete!`);
    });
}
module.exports.reject = () => {
    return new Promise((_, reject) => {
        reject('Rejected test complete!');
    });
}
module.exports.throw = () => {
    return new Promise((_,__) => {
        throw new Error('Throw error test complete!');
    });
}
module.exports.timeout = (timeout) => {
    return new Promise((resolve, _) => {    
        let to = setTimeout(() => {
            clearTimeout(to);
            resolve('Timeout test complete!!!');
        }, timeout);
    });
}
module.exports.notification = (notificator, iterationsCount, intervalPeriod) => {
    notificator.notify({current: intervalPeriod});
    return new Promise((resolve, reject) => {
        let count = 0;
        let interval = setInterval(() => {
            if (notificator) {
                notificator.notify({current: count});
            }
            else reject("notification reject!");
            count++;
            if (count == iterationsCount) {
                clearInterval(interval);
                resolve("Notification test complete!");
            }
        }, intervalPeriod);
    });
}