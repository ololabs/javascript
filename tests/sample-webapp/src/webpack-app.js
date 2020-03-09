import isObject from 'is-object';

if (typeof global.testResult !== 'undefined') {
    global.testResult = 'is object result: ' + isObject({});
}
