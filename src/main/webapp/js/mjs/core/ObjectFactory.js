/**
 *
 * @author Philip Ford
 */
(function($) {

    $.require("mjs/core/strings");
    $.require("mjs/core/ObjectDecorator");
    $.require("mjs/core/oop");

    //================================================================= Private



    //================================================================ Public

    /**
     * Implemented by factories that assume the role of classes:  using blueprints
     * to construct new objects.
     *
     * @type {*}
     */
    $.ObjectFactory = $.Interface("build", "extend", "$super");



    /**
     * <p>Returns a factory for creating objects according to the specified blueprint and configuration.
     * Once a blueprint is set for a Factory, changes to that blueprint will have no impact on
     * subsequent objects based on that blueprint:  the blueprint is cloned internally within
     * getFactory(), and the clone is used as the blueprint for new objects. </p>
     *
     *
     * <p>Regarding the blueprint, property names that begin with underscores will be made
     * private.  That means that they will be inaccessible outside of methods declared in
     * the blueprint. Since we are not dealing with classes, objects created by extensions of a factory
     * will still have access to the private properties declared in the parent factory's blueprint.
     * </p>
     *
     * <p>Regarding the config, it must follow the same form as the config expected by Object.defineProperties().
     * If the configuration for a property declares both either a get() or a set() on the one hand, and sets
     * "writable" as well, then "writable" will be deleted from the configuration for that property:  get/set
     * and writable are incompatible and using both in a property configuration will cause Object.defineProperties()
     * to throw an error.</p>
     *
     *
     * @param {Object} blueprint The object properties
     * @param {Object} [config] A set of property definitions like those used in Object.defineProperties().
     * @return {mjs.ObjectFactory} A Factory instance containing build(), extend() and $super methods
     */
    $.getFactory = function(blueprint, config){
        config = config || { };

        var $super = blueprint.$super,
            $blueprint = $.decorate(blueprint),
            _private = $blueprint.filter(function(value, key){ return key.startsWith("_"); });
        delete blueprint.$super;


        blueprint = $.clone(blueprint);  /* Once the blueprint is set, I don't want people to change it,
                                            and tests prove that this clone() call is necessary for achieving this.
                                            Note:  Using Object.freeze() here, instead of clone(),
                                            breaks the AOP unit tests. */

        // Handling the faulty configurations
        if (config.writable != null && (config.set || config.get )){
            $.log("getFactory", "The property descriptors writable and get/set are incompatible; getFactory() " +
                "deleted writable from the configuration.");
        }

        /*
        The configuration parameter slows object creation by 70% in performance test,
        so I try to perform it only once per factory, calling Object.create() on the
        blueprint to apply the configuration.  Doing so, removes the properties from
        the resulting blueprint and puts them in that blueprint's prototype.
        TODO: examine the implications of that last fact.  One of them appears in the code below.
         */
        blueprint = config ? Object.create(blueprint, config) : Object.create(blueprint);
        //$.log("getFactory", "blueprint before encapsulate:").log(blueprint);

        // Properties that begin with underscores are private to each object created by the factory.
        var proto = $.getPrototype(blueprint);
        $.decorate(_private).forEach(function(value, key){
            //delete blueprint[key];
            Object.encapsulate(key, blueprint, { value: value });
        });
        $.log("getFactory", "blueprint:").log(blueprint);



        /**
         * Creates a new object created according to the <strong>initial</strong> blueprint and configuration.
         *
         */
        function Factory(){}

        $.extend(Factory.prototype, {

            /**
             * Returns a new object created according to the <strong>initial</strong> blueprint and configuration.
             *
             * @param {Object} [args] Properties to mix into the returned object.
             * @return {Object} An object
             */
            build: function(args){
                //return args ? Object.create($.extend({}, blueprint, args)) : Object.create(blueprint);  // Throws private access error in Chrome
                return args ? $.extend(Object.create(blueprint), args) : Object.create(blueprint);
            },



            /**
             * Extends the blueprint of another Factory, and returns a new Factory that will make
             * objects according to the new extended blueprint.
             *
             * @param {Object} args
             * @param {Object} [config] Property configurations like those used by Object.defineProperties().
             * @return {mjs.ObjectFactory} A new Factory containing the extended blueprint.
             */
            extend: function(args, config){
                $.log("blueprint in extend").log(blueprint);
                args.$super = blueprint;
                var $blueprint = $.extend({}, proto, args);
                return $.getFactory($blueprint, config);
            },



            /**
             * In short, returns the specified property from the parent factory's blueprint.  However,
             * the actual returned value will vary depending in the data type of the parent blueprint
             * property:
             *
             * <ul>
             * <li>If the parent blueprint property is an object, $super returns a clone of that object.</li>
             * <li>If the parent blueprint property is a function, $super returns function when the scope fixed to
             *     the specified scope</li>
             * <li>If the parent blueprint property is a String or a primitive, that value is returned.
             * </ul>
             *
             * @param {String} name  The method/property name
             * @param {Object} [scope] The scope of the request function, required if the "name" refers to a function.
             * @return {*}
             */
            $super: function(name, scope){
                $.log("blueprint in $super").log($super);
                var p = $super[name];
                if ($.isFunction(p)) {
                    if (!scope) $.error("getFactory.$super", "A scope is required when the $super property is a function.");
                    return p.bind(scope);
                }
                if ($.isObject(p, true)) return $.extend({}, p);
                return p;
            }

        });

        return Object.freeze(
            Object.implement(new Factory(), $.ObjectFactory)
        );
    };


})(mjs);