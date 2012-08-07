/* === File Prologue ============================================================================

 --- Notes --------------------------------------------------------------------------------------
 * The goal is to read a specified .js file, fetch all other .js files that it requires (and that the files that those
 latter files require, and so on), and to produce one combined .js file
 that meets the following criteria:
 (1) All required files (referenced by $.require() calls in the merged file) are present.
 (2) All required files are followed by $.registerModule() statements.
 (3) The files are present in the order that they were required.
 (4) No required file is included in the merged file more than once.
 (5) No file is required (referenced in a $.require() call) before that file's content appears in the merged file.
 * This file requires env.js, which simulates browser objects so that scripts
 referencing them can run from the command line.
 * load(), readFile() are part of the Rhino library.
 * DomDocument is declared in env.js.
 * The path to env.js is configurable, but only through local variables below.
 * Some IDEs incorrectly report the reference to "arguments" as an error.




 ================================================================================================ */
// Processing command-line options and setting configuration values accordingly.
String.prototype.contains = function(str){
    return this.indexOf(str) != -1;
};


var loadedModules = {};
var basedir, webapp_root, jsroot, outputDir, dependencies_file, fileList, debug = false;
for (var i = 0; i < arguments.length; i++){
    if (arguments[i].contains("--basedir=")){
        basedir = arguments[i].split("=")[1];
    } else if (arguments[i].contains("--src=")){
        webapp_root = arguments[i].split("=")[1];
    } else if (arguments[i].contains("--dependencies=")){
        dependencies_file = arguments[i].split("=")[1];
    } else if (arguments[i].contains("--jsroot=")){
        jsroot = arguments[i].split("=")[1];
    } else if (arguments[i].contains("--out=")){
        outputDir = arguments[i].split("=")[1];
    } else if (arguments[i].contains("--in=")){
        fileList = arguments[i].split("=")[1];
    } else if (arguments[i].contains("--debug=")){
        debug = !!arguments[i].split("=")[1];
    }
}
if (!basedir) throw new Error("The basedir argument is required.");
if (!webapp_root) throw new Error("The src argument is required.");
if (!jsroot) jsroot = webapp_root + "/js";
if (!outputDir) outputDir = basedir + "/out";
if (!dependencies_file) dependencies_file = basedir + "/dependencies.js";

// Loading browser objects to simulate a browser environment.
load(basedir + "/env.js");
var parent = window;
var document = new DOMDocument(basedir + "/index.html");   // This can be any HTML file that has a script that includes mjs.js


// Loading dependencies.
load(dependencies_file);
for (var i = 0; i < dependencies.length; ++i){
    var d = dependencies[i],
        path = d.path || d;
    print("path:  " + (d.root || jsroot) + "/" + path);
    load((d.root || jsroot) + "/" + path);
}

try {
    print(typeof mjs === 'undefined');
}catch(e){
    throw new Error("The MJS library is required.  Provide the path to it in the dependencies file.");
}



/*
 Imports all of the files to be included in the build.  The constructor can take either a String
 for a file name, or a configuration object.  If the parameter is an object, it must have at least a moduleName
 property pointing to a file with imports the required files.  Other properties for the configuration
 object include:
 (1) path:  the full path to the file.
 */
function Profile(file){
    if (mjs.isString(file)){
        file = {
            moduleName: file      // The name of the requested file, which is the basis for the build.
        };
    }
    if (!file.moduleName) {
        var msg = "[Profile] usage: either a string for a file name or an object with a moduleName property pointing to a file is required.";
        throw new Error(msg);
    }
    mjs.augment(file, {
        path: jsroot + "/" + file.moduleName   // The full path to the requested file.
    });
    mjs.extend(this, file);
    load(this.path);
}

var Logger = {
    log: function(outputFile, msg){
        var logFile = basedir + "/merge_log.txt";
        var log = readFile(logFile);
        var template = "{date}...{file}--{msg}.\n";
        if (arguments.length < 2) {
            log += arguments[0];
        } else {
            log += template.applyTemplate({ date: new Date(), file: outputFile, msg: msg});
        }
        var out = new XMLHttpRequest();    // XMLHttpRequest() is declared in env.js.
        out.open("PUT", "file:" + logFile, false);
        out.send(log);
    },

    debug: function(outputFile, msg){
        if (debug === true) Logger.log(outputFile, msg);
    }
};

/*
 Overriding the require() in mjs.js. This is where the real magic of compiling the list of files to include occurs.

 When Rhino loads a .js file(using load()), it interprets and runs the code in the file, thus
 invoking the various $.require() calls that it encounters.  The code below overrides the normal
 behavior of $.require() to build a list of required files, starting with the first file found that
 does not require another.  (Actually the normal implementation does that too, but it also fetches the file
 through XMLHttpRequest, which we don't want here.)

 For example, let's say that Rhino encounters a call to $.require("eventprep/somePanel"), which in turn requires "common/oop,"
 which in turn requires "common/strings" and "common/arrays."  "common/strings" and "common/arrays" don't require other files,
 so they are added to the list of modules to load (loadedModules), if they aren't already there.  Then, if common/oop has no
 more required files, or all of its other files are already in loadedModules, it is added to loadedModules.  Then, the process falls
 back to eventprep/somePanel, and the next require() call that it contains is executed.  Once there are no more require calls in
 eventprep/somePanel, or all of its other required files are already present in loadedModules, then eventprep/somePanel is finally
 added to the of modules to load (loadedModules).
 */
mjs.require = function(n, config){
    var path = n;
    config = config || {};
    if (!config.root) config.root = jsroot;
    try {
        n = n.replace(/\*$/, "__package__");   // Supporting wildcard syntax.
        if (loadedModules[n] || loadedModules[path]) return;  // If the required module is already in the list, exit.
        if (!n.endsWith(".js")){
            path = n + ".js";
        }

        load(config.root + "/" + path);

        // By adding the specified file to loadedModules here, only after loading it with load(),
        // we achieve the effect of adding any other files that it requires first.
        if (!loadedModules[n] && !loadedModules[path]) loadedModules[n] = path;
    }
    catch(e) {
        // TODO
    }
};


// Creates a string from the contents of the specified module.
function addContent(args){
    if (mjs.isString(args)){
        args = { path: args };
    }
    var key = args.key || args.path;
    var path = args.path;
    if (!path) throw new Error("addContent(): a path is required");
    print(key);
    var str = '';
    if (args.wrap !== false) {
        str += '(function($){ \n\t' +
            'var mjs, $this;\n\t' +
            '$this = { name: "{0}" }; \n\t' +
            'mjs = $;\n\t' +
            '$.module("{1}");\n\t'.replaceArgs(key, key);
    }
    if (!path.endsWith(".js")) path += ".js";
    str += readFile((args.root || jsroot) + "/" + path);    // readFile() part of Rhino.
    if (args.wrap !== false) {
        str += "\n})(mjs);";
    }
    str = str.trim();
    str += "\n";
    if (args.register !== false) {
        str += "mjs.registerModule('" + key + "');";
    }
    str += "\n\n\n\n";
    return str;
}






/*
 Runs through the list of files in loadedModules and writes the contents of each to
 ${outputDir}/${fileName}-debug.js.  Takes a Profile object as input.
 */
function merge(profile){
    var tmp, fileName;

    tmp = profile.path.split("/");
    fileName = tmp.pop();
    var str = "";
    for (var i = 0; i < dependencies.length; ++i ){
        if (dependencies[i].addToBuild === true){
            str += addContent(dependencies[i]);
        }
    }
    for (i in loadedModules) {
        if (loadedModules.hasOwnProperty(i)){
            str += addContent({ key: i, path: loadedModules[i]});
        }
    }

    //if (file.addToBuild) {
    str += addContent({ path: profile.moduleName });
    //}
    str += "//end merge";

    // Writing to the output file.
    var out = new XMLHttpRequest();    // XMLHttpRequest() is declared in env.js.
    fileName = fileName.replace(".js", "-debug.js");
    var finalPath = outputDir + "/" + fileName;
    out.open("PUT", "file:" + finalPath, false);
    out.send( str );

    var content = readFile(finalPath);
    if (!profile.moduleName.contains("blank.js")){
        if (content.trim().endsWith("end merge")) {
            Logger.log(profile.moduleName, "merge succeeded");
        } else {
            Logger.debug(finalPath, content);
            Logger.log(profile.moduleName, "merge failed, rerunning...");
            merge(profile);
        }
    }

    loadedModules = {};
}


function cleanup(fileName){
    var out = new XMLHttpRequest();
    var finalPath = outputDir + "/" + fileName;
    out.open("DELETE", "file:" + finalPath, false);
    out.send(  );
    Logger.log("Cleanup complete.\n");
}



/*===================================================================================================
 * MAIN:  Processing the files in the fileList file.
 *
 * For each file in the list, we produce a new file named ${file.name}-debug.js containing every file
 * that the original file requires.
 ===================================================================================================*/
Logger.log(new Date() + " Building...\n");
load(fileList);
files.push({path: basedir + "/blank.js", moduleName: "blank.js" });   // HACK:  Solves the incomplete-last-file problem.
for (var i = 0; i < files.length; ++i){
    merge(new Profile(files[i]));        // Merges the files in that list (loadedModules).
}
cleanup("blank-debug.js");
Logger.log(new Date() + " Finished\n\n\n");


