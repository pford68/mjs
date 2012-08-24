/**
 *
 * @author Philip Ford
 *
 */

(function($) {

    $.require("mjs/core/oop");

    /**
     * @name Command
     * @class Implemented by classes that use a command pattern.
     */
    $.Command = $.Interface("execute");

    /**
     * @name Chain
     * @class Implemented by classes that use a chain of responsibility.
     */
    $.Chain = $.Interface("setSuccessor");

    /**
     * @name Iterable
     * @class Array-like structures and collections.
     */
    $.Iterable = $.Interface("forEach", "size");


    /**
     * @name Iterator
     * @type {*}
     */
    $.Iterator = $.Interface("hasNext", "next");


    /**
     * @name Cloneable
     * @class Implemented by class that implement their own clone() method.
     */
    $.Cloneable = $.Interface("clone");

    /**
     *
     * @name ReversibleCommand
     * @class Implemented by Command classes that produce an undo method.
     */
    $.ReversibleCommand = $.Command.extend("undo");

    /**
     *
     * @name Singleton
     * @class Implemented by classes that can have only one instance.
     */
    $.Singleton = $.Interface("getInstance");

    /**
     *
     * @name ListIterator
     * @class Implemented by lists that use iterators and want to send index of the next item to callbacks
     */
    $.ListIterator = $.Iterator.extend("getCurrentIndex");

})(mjs);