
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const builtPath = './Content/bundles/';

describe('manifest', () => {
    const manifest = require('../rev-manifest.json');
    it('parses', () => {
        assert.ok(manifest);
        const mainBundle = manifest["main.js"];
        assert.ok(mainBundle);
        assert.ok(mainBundle.match(/main-[\w]+\.js/i), mainBundle);
    });
    it('maps to real file', () => {
        const mainBundle = manifest["main.js"];
        const builtBundle = fs.readFileSync(path.resolve(builtPath, mainBundle), 'UTF8');
        assert.ok(builtBundle);
    });
    it('evaluates built javascript', () => {
        const mainBundle = manifest["main.js"];
        const builtBundle = fs.readFileSync(path.resolve(builtPath, mainBundle), 'UTF8');
        const context = {
            testResult: ''
        };
        vm.runInContext(builtBundle, vm.createContext(context));

        assert.equal(context.testResult, 'it works!');
    })
});

describe('webpack', () => {
    it('evaluates built javascript', () => {
        const manifest = require('../rev-manifest.json');
        const mainBundle = manifest["webpack-app.js"];
        const builtBundle = fs.readFileSync(path.resolve(builtPath, mainBundle), 'UTF8');
        const context = {
            testResult: ''
        };
        vm.runInContext(builtBundle, vm.createContext(context));

        assert.equal(context.testResult, 'is object result: true');
    })
});


describe('typescript', () => {
    it('evaluates built javascript', () => {
        const manifest = require('../rev-manifest.json');
        const mainBundle = manifest["typescript-app.js"];
        assert.ok(mainBundle);
        const builtBundle = fs.readFileSync(path.resolve(builtPath, mainBundle), 'UTF8');
        const context = {
            testResult: ''
        };
        vm.runInContext(builtBundle, vm.createContext(context));

        assert.equal(context.testResult, 'is object result: true');
    })
});
