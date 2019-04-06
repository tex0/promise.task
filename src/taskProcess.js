'use strict'
const { timeout, TimeoutError } = require('promise-timeout');
const { childProcess } = require('child_process');
const { EventEmitter }  = require('events');

function TaskProcess(absoluteModulePath, entryPoint, options) {
    const absoluteModulePath_ = absoluteModulePath;
    const entryPoint_ = entryPoint;
    const options_ = options;
    const timeout_ = options ? options.timeout : undefined;

    this._worker = null;

    this._eventEmitter = new EventEmitter();

    this._notificationCallback = null;

    this.__getAbsoluteModulePath = () => {
        return absoluteModulePath_;
    }
    this.__getEntryPoint = () => {
        return entryPoint_;
    }
    this.__getTimeout = () => {
        return timeout_;
    }
    this.__getOptions = () => {
        return options_;
    }

    this._processId;
}

TaskProcess.prototype = {
    get AbsoluteModulePath() { return this.__getAbsoluteModulePath(); },
    get EntryPoint() { return this.__getEntryPoint(); },
    get Timeout() { return this.__getTimeout(); },
    get Options() { return this.__getOptions(); },
    get Id() { return this._processId; }

}

TaskProcess.prototype.onNotification = function(notificationCallback) {
    this._notificationCallback = notificationCallback;
    this._eventEmitter.on('notification', this._notificationCallback);
    return this;
}

TaskProcess.prototype.abort = function(errCallback) {
    if (!errCallback) {
        return new Promise((resolve, reject) => {
            try {
                if (this._worker != null) {
                    this._worker.kill('SIGINT');
                    this._eventEmitter.removeAllListeners('notification');
                    resolve(new Error(`Process with pid=${this._processId} aborted.`));
                }
                else resolve(); 
            } catch (e) {
                reject(e);
            }
        });
    } else {
        if (this._worker != null)
            this._worker.kill();
        errCallback(new Error(`Process with pid=${this._processId} aborted.`), 0);
    }
}

TaskProcess.prototype.run = function() {
    let args = [this.AbsoluteModulePath, this.EntryPoint, (this._notificationCallback ? true : false)].concat([].slice.call(arguments));
    let promiseProcess = new Promise((resolve, reject) => {
        try {
            let workerPath = require.resolve('./workerProcessScript.js');
            this._worker = childProcess.fork(workerPath, args);
            this._processId = this._worker.pid;
            this._worker.on('message', (result) => {
                if (result.error || result.data) {
                    this._eventEmitter.removeAllListeners('notification');
                    this._worker.kill();
                }
                if (result.error) {
                    let error = new Error(result.error.errorMessage);
                    error.stack = result.error.errorStack;
                    this._worker.kill();
                    reject(error);
                }
                else if(result.notification) {
                        this._eventEmitter.emit('notification', result.notification);
                } else {
                    resolve(result.data);
                }
            });
            this._worker.on('error', reject);
            this._worker.on('exit', (code, signal) => {
                if (code !== 0)
                    reject(new Error(`Worker process exited with exit code ${code}. Signal: ${signal}`));
            });
            this._worker.on('close', (code, signal) => {
                if (code !== 0)
                    reject(new Error(`Worker process channel closed with exit code ${code}. Signal: ${signal}`));
            });
        } catch(e) {
            if (!(e instanceof Error))
                e = new Error(e);
            reject(e);
        }
    });

    if(Number.isInteger(this.Timeout))
        return timeout(promiseProcess, this.Timeout).catch(async (err) => {
                                                            if (err instanceof TimeoutError) 
                                                                await this.abort();
                                                            throw err;
                                                            }).finally(() => {
                                                                this._eventEmitter.removeAllListeners('notification');
                                                            });
    else return promiseProcess;
}

module.exports = TaskProcess;