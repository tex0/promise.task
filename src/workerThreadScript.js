'use strict'
const { workerData, parentPort } = require('worker_threads');

function Notificator(parentPort) {
    const _parentPort = parentPort;

    this.__getParentPort = function() {
        return _parentPort;
    }
}
Notificator.prototype.notify = function(notificationInfo) {
    this.__getParentPort().postMessage({notification: notificationInfo});
}

(async function Run() {
    if (!workerData || !workerData.args) {
        let error_stack = new Error().stack;
        let error_message = 'Execute worker error: invalid worker data';
        parentPort.postMessage({ error: { message: error_message, stack: error_stack } });
    }
    else {
        try {
            const requiredModule = require(workerData.absoluteModulePath);
            let procedure = (workerData.entryPoint && workerData.entryPoint !== '') ? requiredModule[workerData.entryPoint] : requiredModule;
            if (!procedure || !(procedure instanceof Function))
                throw new Error('Execute worker error: calling object is not a function');
            let args = workerData.canNotify === true ? [new Notificator(parentPort)].concat(workerData.args) : workerData.args;
            let procedureResult = procedure.apply(requiredModule, args);
            if (procedureResult instanceof Promise) {
                procedureResult = await procedureResult;
            }
            parentPort.postMessage({data: procedureResult});
        }
        catch(e) {
            let stack = e instanceof Error ? e.stack : (new Error()).stack;
            let message = e instanceof Error ? e.message : e;
            parentPort.postMessage({ error: { errorMessage: message, errorStack: stack } } );
        }
    }
})();