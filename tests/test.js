'use strict'
//Promise = require('bluebird');
Promise = require('../src/promiseTask')(Promise);

function RunTests(inProcess) {
    try {
        if(!inProcess) inProcess = false;
        simpleTest(inProcess);
        echoTest(inProcess);
        rejectTest(inProcess);
        throwErrorTest(inProcess);
        timeoutTest(inProcess);
        notificationTest(inProcess);
    }
    catch(e) {
        console.error(e);
    }
}

async function simpleTest(inProcess) {
    console.log(`simpleTest begin [inProcess: ${inProcess}]`);
    try {
        let result = await Promise.task(require.resolve('./testsModule'), 'simple', {inProcess: inProcess}).run();
        console.log(`simpleTest result: ${result}`);
    } catch(e) {
        console.error(`simpleTest error: ${e} [inProcess: ${inProcess}]`);
        console.error(`simpleTest [inProcess: ${inProcess}] error stack: ${e.stack}`);
    }
    console.log(`simpleTest end [inProcess: ${inProcess}]`);
}

async function echoTest(inProcess) {
    console.log(`echoTest begin [inProcess: ${inProcess}]`);
    try {
        let result = await Promise.task(require.resolve('./testsModule'), 'echo', {inProcess: inProcess}).run('ECHO_MESSAGE');
        console.log(`echoTest result: ${result}`);
    } catch(e) {
        console.error(`echoTest error: ${e} [inProcess: ${inProcess}]`);
        console.error(`echoTest [inProcess: ${inProcess}] error stack: ${e.stack}`);
    }
    console.log(`echoTest end [inProcess: ${inProcess}]`);
}

async function rejectTest(inProcess) {
    console.log(`rejectTest begin [inProcess: ${inProcess}]`);
    try {
        let result = await Promise.task(require.resolve('./testsModule'), 'reject', {inProcess: inProcess}).run();
        console.log(`rejectTest result: ${result}`);
    } catch(e) {
        console.error(`rejectTest error: ${e} [inProcess: ${inProcess}]`);
        console.error(`rejectTest [inProcess: ${inProcess}] error stack: ${e.stack}`);
    }
    console.log(`rejectTest end [inProcess: ${inProcess}]`);
}

async function throwErrorTest(inProcess) {
    console.log(`throwErrorTest begin [inProcess: ${inProcess}]`);
    try {
        let result = await Promise.task(require.resolve('./testsModule'), 'throw', {inProcess: inProcess}).run();
        console.log(`throwErrorTest result: ${result}`);
    } catch(e) {
        console.error(`throwErrorTest error: ${e} [inProcess: ${inProcess}]`);
        console.error(`throwErrorTest [inProcess: ${inProcess}] error stack: ${e.stack}`);
    }
    console.log(`throwErrorTest end [inProcess: ${inProcess}]`);
}

async function timeoutTest(inProcess) {
    console.log(`timeotTest begin [inProcess: ${inProcess}]`);
    try {
        let task = Promise.task(require.resolve('./testsModule'), 'timeout', {timeout: 2000, inProcess: inProcess});
        let result = await task.run(3000);
        console.log(`timeoutTest result: ${result}`);
    } catch(e) {
        console.error(`timeoutTest error: ${e} [inProcess: ${inProcess}]`);
        console.error(`timeoutTest [inProcess: ${inProcess}] error stack: ${e.stack}`);
    }
    console.log(`timeotTest end [inProcess: ${inProcess}]`);
}

async function notificationTest(inProcess) {
    console.log(`notificationTest begin [inProcess: ${inProcess}]`);
    try {
        let task = Promise.task(require.resolve('./testsModule'), 'notification', {inProcess: inProcess});
        let result = await task.onNotification(notificationTest.notification).run(10, 100);
        console.log(`notificationTest result: ${result}`);
    } catch(e) {
        console.error(`notificationTest error: ${e} [inProcess: ${inProcess}]`);
        console.error(`notificationTest [inProcess: ${inProcess}] error stack: ${e.stack}`);
    }
    console.log(`notificationTest end [inProcess: ${inProcess}]`);
}

notificationTest.notification = (notificationInfo) => {
    console.log(`Notification info: ${notificationInfo.current}`);
}

module.exports.run = () => {
    RunTests();
    RunTests(true);
};