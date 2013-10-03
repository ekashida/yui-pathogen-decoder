var NAMESPACE           = 'p';
var GROUP_DELIMITER     = ';';
var MODULE_DELIMITER    = ',';
var GROUP_SUB_DELIMITER = '+';
var DEFAULT_FILTER      = 'min';
var GALLERY_PREFIX      = 'gallery-';

var VALIDATOR = {
    js: {
        raw: true,
        min: true,
        debug: true
    },
    css: {
        raw: true,
        min: true
    }
};

/**
 * Decoder for the core module group. Exported for testing purposes.
 * @method coreDecoder
 * @param {String} version YUI version
 * @param {String[]} modules Core module names
 * @return {Object} Decoded modules and version
 */
exports.coreDecoder = function (version, modules) {
    return {
        name:       'core',
        modules:    modules.split(MODULE_DELIMITER),
        version:    version
    };
};

/**
 * Decoder for the gallery module group. Exported for testing purposes.
 * @method galleryDecoder
 * @param {String} version Gallery version (without `gallery-` prefix)
 * @param {String[]} modules Gallery module names (without `gallery-` prefix)
 * @return {Object} Decoded modules and version
 */
exports.galleryDecoder = function (version, modules) {
    var len,
        i;

    // 2013.06.20-02-07 => gallery-2013.06.20-02-07
    version = GALLERY_PREFIX + version;

    modules = modules.split(MODULE_DELIMITER);
    for (i = 0, len = modules.length; i < len; i += 1) {
        // bitly => gallery-bitly
        modules[i] = GALLERY_PREFIX + modules[i];
    }

    return {
        name:       'gallery',
        modules:    modules,
        version:    version
    };
};

/**
 * Decoder for application module groups. Exported for testing purposes.
 * @method appDecoder
 * @param {String} version The group's `root` which may have the version included.
 * @param {String[]} modules Application module names
 * @return {Object} Decoded modules
 */
exports.appDecoder = function (version, modules) {
    return {
        name:       'app',
        version:    version,
        modules:    modules.split(MODULE_DELIMITER)
    };
};

var decoder = {
    core:       exports.coreDecoder,
    gallery:    exports.galleryDecoder
};

/**
 * This decoding strategy's name. Potentially used to route combo requests.
 * @method namespace
 * @return {String}
 */
exports.namespace = function () {
    return NAMESPACE;
};

exports.decode = function (url, callback) {
    // '/a;b;c' => 'a;b;c' => ['a', 'b', 'c']
    var groups = url.path.slice(1).split(GROUP_DELIMITER),
        decodedGroups = [],
        filter,
        type,
        decoded,
        parts,
        name,
        len,
        i;

    // The last group contains filter (optional) and type (required) metadata.
    parts = groups[groups.length - 1].split('.');

    // We require the file type as a faux extension (.js or .css) because some
    // IE versions use the extension to determine the content type:
    // http://msdn.microsoft.com/en-us/library/ms775148(v=vs.85).asp
    type = parts.pop();
    if (!VALIDATOR[type]) {
        return callback(new Error(
            'Encountered an invalid type while decoding: ' + type
        ));
    }

    // Determine the filter (i.e., min, debug, or raw).
    filter = parts[parts.length - 1];
    if (VALIDATOR[type][filter]) {
        // Optional filter was provided; remove it from the path parts.
        parts.pop();
    } else {
        // Optional filter was not provided; use default.
        filter = DEFAULT_FILTER;
    }

    // Replace last group after parsing out the filter and type metadata.
    groups[groups.length - 1] = parts.join('.');

    // Decode each encoded module group.
    for (i = 0, len = groups.length; i < len; i += 1) {
        parts = groups[i].split(GROUP_SUB_DELIMITER);

        // [ group name, group version, modules ]
        if (parts.length === 3) {
            name = parts.shift();

            if (decoder[name]) {
                decoded = decoder[name].apply(null, parts);
            } else {
                return callback(
                    new Error('Unrecognized module group ' + name)
                );
            }
        }
        // Application module groups with build directories similar to YUI
        // modules are compressed using the `root` followed by a list of module
        // names.
        // [ group version, modules ]
        else if (parts.length === 2) {
            decoded = exports.appDecoder.apply(null, parts);
        }
        // Application modules with paths that were not compressed are simply
        // represented as a group containing a single path.
        else if (parts.length === 1) {
            decoded = {
                name: 'path',
                modules: parts
            };
        }
        else {
            return callback(
                new Error('Module group has unexpected format')
            );
        }

        if (decoded instanceof Error) {
            return callback(decoded);
        }

        decodedGroups.push(decoded);
    }

    callback(null, {
        groups: decodedGroups,
        filter: filter,
        type:   type
    });
};
