/**
 *
 * @author Philip Ford
 */
(function($) {

    /**
     * Returns a factory for creating objects according to the specified blueprint and configuration.
     * Once a blueprint is set for a Factory, changes to that blueprint will have no impact on
     * subsequent objects based on that blueprint:  the blueprint is cloned internally within
     * ObjectFactory, and the clone is used as the blueprint for new objects.
     *
     *
     * @param blueprint
     * @param config
     * @return {*}
     * @constructor
     */
    $.getFactory = function(blueprint, config){
        config = config || { };
        blueprint = $.clone(blueprint);  // Once the blueprint is set, I don't want people to change it.
                                         // Object.freeze() may work here too.
        if (config.writable != null && (config.set || config.get )){
            $.log("getFactory", "The property descriptors writable and get/set are incompatible; ObjectFactory deleted writable from the configuration.");
        }
        blueprint = config ? Object.create(blueprint, config) : Object.create(blueprint);
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
             * @return {Object} An object
             */
            build: function(args){
                var spec = args ? $.extend({}, blueprint, args) : blueprint;
                return Object.create(spec);
            },

            /**
             * Extends the blueprint of another Factory, and returns a new Factory that will make
             * objects according to the new extended blueprint.
             *
             * @param args
             * @param config
             * @return {*} A new Factory containing the extended blueprint.
             */
            extend: function(args, config){
                return $.getFactory($.extend({}, blueprint, args), config);
            },

            /**
             * In short, returns the specified property from the parent factory's blueprint.  However,
             * the actual returned value will vary depending in the datatype of the parent blueprint
             * property:
             *
             * <ul>
             * <li>If the parent blueprint property is an object, $super returns a clone of that object.</li>
             * <li>If the parent blueprint property is a function, $super returns function when the scope fixed to
             *     the specified scope</li>
             * <li>If the parent blueprint property is a String or a primitive, that value is returned.
             * </ul>
             *
             * @param name
             * @param scope
             * @return {*}
             */
            $super: function(name, scope){
                var p = blueprint[name];
                if ($.isFunction(p)) {
                    if (!scope) $.error("getFactory.$super", "A scope is required when the $super property is a function.");
                    return $.proxy(scope, p);
                }
                if ($.isObject(p, true)) return $.extend({}, p);
                return p;
            }
        });

        return Object.freeze(new Factory());
    };


})(mjs);