'use strict'
const taskProcess = require('./taskProcess');
const taskThread = require('./taskThread');

function Task(absoluteModulePath, entryPoint, options) {
    const absoluteModulePath_ = absoluteModulePath;
    const entryPoint_ = entryPoint;
    const options_ = options;

    this._worker = options && options.inProcess ? 
                                new taskProcess(absoluteModulePath, entryPoint, options) : 
                                new taskThread(absoluteModulePath, entryPoint, options);

    this._notificationCallback = null;

    this.__getAbsoluteModulePath = () => {
        return absoluteModulePath_;
    }
    this.__getEntryPoint = () => {
        return entryPoint_;
    }
    this.__getInProcessFlag = () => {
        return options && !!options.inProcess;
    }
    this.__getOptions = () => {
        return options_;
    }
}

Task.prototype = {
    get AbsoluteModulePath() { return this.__getAbsoluteModulePath(); },
    get EntryPoint() { return this.__getEntryPoint(); },
    get Options() { return this.__getOptions(); },
    get TaskId() { return this._worker.Id; },
    get InProcess() { return this.__getInProcessFlag(); }
}

Task.prototype.run = function() {
    let args = [].slice.call(arguments);
    return this._worker.run.apply(this._worker, args);
}

Task.prototype.abort = function(errCallback) {
    return this._worker.abort(errCallback);
}

Task.prototype.onNotification = function(notificationCallback) {
    this._worker.onNotification(notificationCallback)
    return this;
}

function task(absoluteModulePath, entryPoint, options) {
    return new Task(absoluteModulePath, entryPoint, options);
}

function addWorkerApi(Promise) {
    if (Promise) {
        if (!Promise.task) {
            Promise.task = task;
        }
        return Promise;
    }
    else throw new Error('Not available Promise object');
}

module.exports = (promise) => {
    return addWorkerApi(promise);
}
module.exports.Task = Task;
module.exports.tests = require('../tests/test').run;