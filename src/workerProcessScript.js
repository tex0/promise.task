'use strict'
const process = require('process');

function Notificator(processPort) {
    const _processPort = processPort;

    this.__getProcessPort = function() {
        return _processPort;
    }
}
Notificator.prototype.notify = function(notificationInfo) {
    this.__getProcessPort().send({notification: notificationInfo});
}

async function Run() {
    let modulePath = process.argv[2];
    let entryPoint = process.argv[3];
    let canNotify = process.argv[4] == 'true';

    let args = Array.prototype.slice.call(process.argv).slice(5);
    if (!args) {
        let error_stack = new Error().stack;
        let error_message = 'Execute worker error: invalid worker data';
        process.send({ error: { message: error_message, stack: error_stack } });
    }
    else {
        try {
            const requiredModule = require(modulePath);
            let procedure = (entryPoint && entryPoint !== '') ? requiredModule[entryPoint] : requiredModule;
            if (!procedure || !(procedure instanceof Function))
                throw new Error('Execute worker error: calling object is not a function');
            let moduleArgs = args;
            if (canNotify) {
                moduleArgs = [new Notificator(process)].concat(args);
            }
            
            let procedureResult = procedure.apply(requiredModule, moduleArgs);
            if (procedureResult instanceof Promise) {
                procedureResult = await procedureResult;
            }
            process.send({data: procedureResult});
        } catch(e) {
            let stack = e instanceof Error ? e.stack : (new Error()).stack;
            let message = e instanceof Error ? e.message : e;
            process.send({ error: { errorMessage: message, errorStack: stack } } );
        }
    }
}

Run();