var assert      = require('assert'),
    strategy    = require('../index');

describe('namespace', function () {

    it('should return a valid namespace', function () {
        var ns = strategy.namespace();
        assert(typeof ns === 'string', 'namespace should be a string');
        assert(ns.indexOf(' ') === -1, 'namespace should not contain spaces');
    });

});

describe('decode', function () {

    it('should decode core modules', function () {
        strategy.decode({
            path: '/core+3.12.0+oop,node-base.debug.js',
            query: {}
        }, function (err, decoded) {
            assert(err === null, 'unexpected error');
            assert(decoded.filter === 'debug', 'unexpected filter');
            assert(decoded.type === 'js', 'unexpected type');
            assert(decoded.groups.length === 1, 'unexpected number of groups');
            assert(decoded.groups[0].name === 'core', 'unexpected group name');
            assert(decoded.groups[0].modules.length === 2, 'unexpected number of modules');
            assert(decoded.groups[0].version === '3.12.0', 'unexpected version');
        });
    });

    it('should decode gallery modules', function () {
        strategy.decode({
            path: '/gallery+2013.09.04-21-56+pathogen-encoder.js',
            query: {}
        }, function (err, decoded) {
            assert(err === null, 'unexpected error');
            assert(decoded.filter === 'min', 'unexpected filter');
            assert(decoded.type === 'js', 'unexpected type');
            assert(decoded.groups.length === 1, 'unexpected number of groups');
            assert(decoded.groups[0].name === 'gallery', 'unexpected group name');
            assert(decoded.groups[0].modules.length === 1, 'unexpected number of modules');
            assert(decoded.groups[0].version === 'gallery-2013.09.04-21-56', 'unexpected version');
        });
    });

    it('should decode application modules', function () {
        strategy.decode({
            path: '/os/mit/td/ape-applet-0.0.35+ape-applet-templates-applet-remove,af-applet-removeview.js',
            query: {}
        }, function (err, decoded) {
            assert.strictEqual(err, null, 'unexpected error');
            assert.strictEqual(decoded.filter, 'min', 'unexpected filter');
            assert.strictEqual(decoded.type, 'js', 'unexpected type');
            assert.strictEqual(decoded.groups.length, 1, 'unexpected number of groups');
            assert.strictEqual(decoded.groups[0].name, 'app', 'unexpected group name');
            assert.strictEqual(decoded.groups[0].modules.length, 2, 'unexpected number of modules');
            assert.strictEqual(decoded.groups[0].version, 'os/mit/td/ape-applet-0.0.35', 'unexpected version');
        });
    });

    it('should default to `min` for invalid js filter', function () {
        strategy.decode({
            path: '/core+3.12.0+oop,node-base.foo.js',
            query: {}
        }, function (err, decoded) {
            assert(err === null, 'should not return an error');
            assert(decoded.filter === 'min', 'should default to `min`');
        });
    });

    it('should not fail for valid js filter', function () {
        strategy.decode({
            path: '/core+3.12.0+oop,node-base.raw.js',
            query: {}
        }, function (err, decoded) {
            assert(err === null);
            assert(decoded.filter === 'raw');
        });
        strategy.decode({
            path: '/core+3.12.0+oop,node-base.debug.js',
            query: {}
        }, function (err, decoded) {
            assert(err === null);
            assert(decoded.filter === 'debug');
        });
        strategy.decode({
            path: '/core+3.12.0+oop,node-base.min.js',
            query: {}
        }, function (err, decoded) {
            assert(err === null);
            assert(decoded.filter === 'min');
        });
    });

    it('should default to `min` for invalid css filter', function () {
        strategy.decode({
            path: '/core+cssbase,cssreset.bar.css',
            query: {}
        }, function (err, decoded) {
            assert(err === null);
            assert(decoded.filter === 'min');
        });
    });

    it('should not fail for valid css filter', function () {
        strategy.decode({
            path: '/core+3.12.0+cssbase,cssreset.raw.css',
            query: {}
        }, function (err, decoded) {
            assert(err === null);
            assert(decoded.filter === 'raw');
        });
        strategy.decode({
            path: '/core+3.12.0+cssbase,cssreset.min.css',
            query: {}
        }, function (err, decoded) {
            assert(err === null);
            assert(decoded.filter === 'min');
        });
    });

    it('should fail when too many or too few group components', function () {
        strategy.decode({
            path: '/core',
            query: {}
        }, function (err) {
            assert(err instanceof Error, 'should fail when too few');
        });
        strategy.decode({
            path: '/core+gallery+core+3.12.0+yui',
            query: {}
        }, function (err) {
            assert(err instanceof Error, 'should fail when too many');
        });
    });

});
