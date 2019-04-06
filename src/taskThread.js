'use strict'
const { timeout, TimeoutError } = require('promise-timeout');
const { Worker } = require('worker_threads');
const { EventEmitter }  = require('events');

function TaskThread(absoluteModulePath, entryPoint, options) {
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

    this._threadId;
}

TaskThread.prototype = {
    get AbsoluteModulePath() { return this.__getAbsoluteModulePath(); },
    get EntryPoint() { return this.__getEntryPoint(); },
    get Timeout() { return this.__getTimeout(); },
    get Options() { return this.__getOptions(); },
    get Id() { return this._threadId; }
}

TaskThread.prototype.onNotification = function(notificationCallback) {
    this._notificationCallback = notificationCallback;
    this._eventEmitter.on('notification', this._notificationCallback);
    return this;
}

TaskThread.prototype.abort = function(errCallback) {
    if (!errCallback) {
        return new Promise((resolve, reject) => {
            try {
                if (this._worker != null) {
                    this._worker.terminate((err, errCode) => {
                        let error = new Error(`Thread Id=${this._threadId} aborted.`);
                        error.baseError = err;
                        error.code = errCode;
                        this._eventEmitter.removeAllListeners('notification');
                        resolve(error);
                    });
                }
                else resolve(); 
            } catch (e) {
                reject(e);
            }
        });
    } else {
        if (this._worker != null)
            this._worker.terminate(errCallback);        
    }
}
TaskThread.prototype.run = function() {
    let args = [].slice.call(arguments);
    let promiseThread = new Promise((resolve, reject) => {
        try {
            let workerPath = require.resolve('./workerThreadScript.js');
            this._worker = new Worker(workerPath, { workerData: { 
                                                            absoluteModulePath: this.AbsoluteModulePath, 
                                                            entryPoint: this.EntryPoint, 
                                                            args: args,
                                                            canNotify: this._notificationCallback ? true : false
                                                        }
                                            });
            this._threadId = this._worker.threadId;
            this._worker.on('message', (result) => { 
                if (result.error || result.data) {
                    this._eventEmitter.removeAllListeners('notification');
                }
                if (result.error) {
                    let error = new Error(result.error.errorMessage);
                    error.stack = result.error.errorStack;
                    reject(error);
                }
                else if(result.notification) {
                        this._eventEmitter.emit('notification', result.notification);
                } else 
                    resolve(result.data);
            });
            this._worker.on('error', reject);
            this._worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker thread stopped with exit code ${code}`));
            });
        } catch(e) {
            if (!(e instanceof Error))
                e = new Error(e);
            reject(e);
        }
    });
    if(Number.isInteger(this.Timeout))
        return timeout(promiseThread, this.Timeout).catch(async (err) => {
                                                            if (err instanceof TimeoutError) 
                                                                await this.abort();
                                                            throw err;
                                                            }).finally(() => {
                                                                this._eventEmitter.removeAllListeners('notification');
                                                            });
        else  return promiseThread;
}

module.exports = TaskThread;