# promise.task
Wrapper for execution tasks in parallel context using 'worker_thread' or 'child_process'

## Usage
```javascript
Promise = require('promise.task')(Promise);
```
* `Promise` - used promise object(native Promise or bluebird Promise).

```javascript 
let task = Promise.task(absoluteModulePath, entryPoint, options) 
```
The Promise.task() function returns a task object for its subsequent execution. Parameters:
* `absoluteModulePath` - absolute path to module for loading in parallel context with function for parallel execution.
* `entryPoint` - name of module function for running. If this parameter is empty string or is not defined, the module object will be calling as a function
* `options`:
    * `timeout` - timeout executable function in loaded module
    * `inProcess` - if this parameter is true, the target task parallel context will be a child process. Default - runing in worker thread
    
### Task object members:
```javascript
task.run(arg1, arg2,...)
```
Executing a task as a specified function of a target module in a parallel context. Parameters:
* `arg1, arg2,...` - arguments of runned function of module loaded in parallel context

```javascript
task.abort(abortCallback)
```
Force stopping execution task. Will be generated error after this call (catch this error). Parameters:
* `abortCallback` - callback from abort.

```javascript
task.onNotification(notificationCallback)
```
Subscribe to notification from executing function in parallel context. Returns current task object. Parameters:
* `notificationCallback` - callback for handle notification. Function prototype:
```javascript
function(notificationInfo){
    // handler code
}
```


# Examples

### testModule.js:
```javascript
// will be executed if the 'entryPoint' parameter in Promise.task is an empty string or is not defined
module.exports = () => { 
    return 'Executing module object as function';
}
module.exports.echo = (echoMessage) => {
    return echoMessage;
}
// The parent context will get the result of this promise.
module.exports.echoAsync = (echoMessage) => {
    return Promise.resolve(echoMessage);
}
// if you want to use notifications, your executable function must contain the first argument as notificator object with the "notify" method called to trigger the notification.
module.exports.notification = function(notificator) {
    if (notificator)
        notificator.notify({message: 'Hello!'});
}
```
### using testModule functions as parallel tasks:
```javascript
try {
    let taskResult = await Promise.task(require.resolve('./testsModule'), 'echo').run('[TEST MESSAGE]');
    console.log(taskResult); // write [TEST MESSAGE] in console
}
catch(e) {
    console.log(e);
}

// 
// you can execute the target function in a separate child process by setting the option 'inProcess' as true:

try {
    let taskResult = await Promise.task(require.resolve('./testsModule'), 'echoAsync', {inProcess: true}).run('[TEST MESSAGE]');
    console.log(taskResult); // write [TEST MESSAGE] in console
}
catch(e) {
    console.log(e);
}

// 
// Use notification
try {
    let task = Promise.task(require.resolve('./testsModule'), 'notification');
    let taskResult = await task.onNotification(notificationHandler).run();
}
catch(e) {
    console.log(e);
}

function notificationHandler(notificationInfo) {
    console.log(notificationInfo); // object {message: hello}
}
```
* You can may set a setting 'timeout' for the task being running with timeout and if the task has not yet been completed after timeout expires you will get a thrown exception 'TimeoutError' (from package 'promise-timeout')
* If any error occurs during the execution of a parallel task, an this error will be generated in the running context that you can catch  by wrapping the task running code in try/catch blocks (or use .catch() function, if you use Promise without 'async/await' syntactic sugar)
