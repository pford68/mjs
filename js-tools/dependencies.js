/**
 * Paths are relative to jsroot by default
 */

dependencies = [
    { path: "js/mjs.js", addToBuild: true, root: webapp_root, wrap: false },
    { path: "js/mjsConfig.js", addToBuild: true, root: webapp_root, wrap: false },
    "mjs/core/strings.js",   // For use in the overriding version of jQuery.require().
    "mjs/core/arrays.js"     // Used in merge()
];










