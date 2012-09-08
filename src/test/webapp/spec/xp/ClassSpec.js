describe("mjs.xp.Class() suite", function() {
    var $ = mjs;

    $.require("mjs/xp/Class");

    var classBody, body,
        superClassObj, subClassObj, subSubClassObj;


    beforeEach(function() {
        classBody = {
            id: null,
            initialize: function(args) {
                if (args) this.id = args.id;
            },
            setMessage: function(msg) {
                this.message = msg;
            },
            colorize: function (id, color) {
                document.getElementById(id).style.color = color;
            },
            toString: function() {
                var i, props = "{";
                for (i in this) {
                    props += i + ":" + this[i] + ", ";
                }
                props = props.replace(/,\s$/, "");
                props += "}";
                return props;
            }
        };
        body = {};
        $.extend(body, classBody);


        $.xp.Class("SuperClass").define(body);
        $.xp.Class("SubClass").extend(SuperClass).define({
            initialize: function(args) {
                if (args) this.id = "__subclass" + args.id + "__";
            },
            setMessage: function(msg) {
                this.message = 2 + 2 + msg;
            },
            newMethod: function() {
            }
        });
        $.xp.Class("SubSubClass").extend(SubClass).define({});
        superClassObj = new SuperClass({id: 'test'});
        subClassObj = new SubClass({id: 'child', newProp: "this should not be added"});
        subSubClassObj = new SubSubClass();
    });

    describe("Each resulting class", function(){
        it("should still be a function", function(){
            expect($.isFunction(SuperClass)).toBeTruthy();
            expect($.isFunction(SubClass)).toBeTruthy();
            expect($.isFunction(SubSubClass)).toBeTruthy();
        });

        it("should have prototype.", function(){
            expect(SuperClass.prototype).toBeDefined();
            expect(SubClass.prototype).toBeDefined();
            expect(SubSubClass.prototype).toBeDefined();
        });

        it("should be assigned to the constructor property of its instances, in order for \"instanceof\" to work as expected.", function(){
            expect(superClassObj.constructor).toBe(SuperClass);
            expect(subClassObj.constructor).toBe(SubClass);
            expect(subSubClassObj.constructor).toBe(SubSubClass);
        });
    });


    describe("initialization", function(){
        it("The initialize() method should be called when the constructor is invoked with the \"new\" keyword.", function(){
            expect(superClassObj.id).toEqual("test");
        });

        it("A default constructor should be created if no initialize() method is passed to $.xp.Class()", function(){
            $.xp.Class("MyGreatClass").define({
                kill: function(){}
            });
            expect(MyGreatClass.prototype.initialize).toBeDefined();
        });

        it("The parameter-less constructor of the parent class should be called when a subclass' constructor is invoked with the \"new\" keyword.", function(){
            /*
            Below if the parent class constructor has been invoked, properties set by the parent constructor
            should have the values set by that constructor, unless reset by the subclass constructor.
             */
            $.xp.Class("MyGreatClass").define({
                id: null,
                initialize: function(){
                    this.id = 5;
                }
            });
            $.xp.Class("MyGreatSubClass").extend(MyGreatClass).define({});
            var instance = new MyGreatSubClass();
            expect(instance.id).toEqual(5);

            $.xp.Class("MyGreatSubClass2").extend(MyGreatClass).define({
                id: 3,
                initialize: function(){
                    this.age = 6;
                }
            });
            var instance2 = new MyGreatSubClass2();
            expect(instance2.id).toEqual(5);
        });

        it("The subclass constructor should override settings made by the parent constructor.", function(){
            /*
            Below if the parent class constructor has been invoked, properties set by the parent constructor
            should have the values set by that constructor, unless reset by the subclass constructor.
             */
            $.xp.Class("MyGreatClass").define({
                id: null,
                initialize: function(){
                    this.id = 5;
                }
            });
            // In this case, the subclass has a constructor that overrides the settings made by the parent constructor.
            $.xp.Class("MyGreatSubClass").extend(MyGreatClass).define({
                initialize: function(id){
                    this.id = id;
                }
            });
            var instance = new MyGreatSubClass(6);
            expect(instance.id).toEqual(6);
        });

        it("Superclass constructors that have parameters should not be called automatically.", function(){
            $.xp.Class("MyGreatClass").define({
                id: "MyGreatClass_1001",
                msg: "my constructor has parameters",
                initialize: function(id){
                    throw new Error("This constructor should not have been called.");
                }
            });

            $.xp.Class("MyGreatSubClass").extend(MyGreatClass).define({ });
            try {
                var instance = new MyGreatSubClass();
            } catch(e){
                this.fail("We should not reach this point:  " + e.message);
            }
        });

        it("Unlike Java, no error should be thrown if parent has no parameter-less constructor.", function(){

        });


         it("Constructors (and parent class constructors) should not be called more than once during initialization.", function(){
            $.xp.Class("MyGreatClass").define({
                id: 2,
                initialize: function(id){
                    this.id *= 2;
                }
            });
            $.xp.Class("MyGreatSubClass").extend(MyGreatClass).define({
                initialize: function(){
                    this.$super(0);
                }
            });
            var instance = new MyGreatSubClass();
            expect(instance.id).toEqual(4);
        });
    });


    describe("inheritance and polymorphism", function(){
        it("Each subclass should inherit all public properties and methods (except the initializer) from its parent class", function(){
            expect(subClassObj.colorize).toBeDefined();
            expect(SubClass.prototype).toBeDefined();
            expect(subSubClassObj.colorize).toBeDefined();
            expect(subSubClassObj.newMethod).toBeDefined();
            expect(SubSubClass.prototype).toBeDefined();
            expect(superClassObj.colorize).toBe(subClassObj.colorize);
            expect(superClassObj.initialize).not.toBe(subClassObj.initialize);
        });


        it("If a subclass contains properties/methods that exist in the parent class, its version of each should override the parent-class version", function(){
            var superMsg = "Hello from SuperClass";
            expect(superClassObj.setMessage).not.toBe(subClassObj.setMessage);
            expect("__subclasschild__").toEqual(subClassObj.id);

            superClassObj.setMessage(superMsg);
            subClassObj.setMessage(superMsg);
            expect(superMsg).toEqual(superClassObj.message);
            expect(4 + superMsg).toEqual(subClassObj.message);
        });


        describe("instanceof", function(){
            it("should be true for an object's own class", function() {
                expect(subClassObj instanceof SubClass).toBeTruthy();
                expect(subSubClassObj instanceof SubSubClass).toBeTruthy();
                expect(superClassObj instanceof SuperClass).toBeTruthy();
            });

            it("should be true for all classes further up in the hierarchy", function() {
                expect(subClassObj instanceof SuperClass).toBeTruthy();
                expect(subClassObj instanceof Object).toBeTruthy();

                expect(subSubClassObj instanceof SubClass).toBeTruthy();
                expect(subSubClassObj instanceof SuperClass).toBeTruthy();
                expect(subSubClassObj instanceof Object).toBeTruthy();

                expect(superClassObj instanceof Object).toBeTruthy();
            });

            it("should be false for all classes lower in the hierarchy", function() {
                expect(subClassObj instanceof SubSubClass).toBeFalsy();
                expect(superClassObj instanceof SubClass).toBeFalsy();
            });
        });

        describe("Multiple inheritance", function(){
            beforeEach(function(){
                var mixin = {
                    finalize: function(){
                        if (this.store) this.store = null;
                    },
                    save: function(item){
                        if (!this.store) this.store = [];
                        this.store.push(item);
                    }
                }
                $.xp.Class("mjs.mi.Test1")
                    .define({
                        identify: function(){  return "Hello, from Test1"; }
                    });
                $.xp.Class("mjs.mi.Test2").extend(mjs.mi.Test1, SuperClass, mixin)
                    .define({
                        insult: function(){ return "F you"; },
                        setMessage: function(){ return "Not implemented"; }
                    });
            });

            it("should mix the properties of the parent prototype into the subclass prototype", function(){

                function isFunction(f){
                    expect($.isFunction(f)).toBeTruthy();
                }

                var Test2 = mjs.mi.Test2;
                ['insult', 'setMessage', 'identify', 'colorize', 'initialize', 'toString', 'finalize', 'save'].forEach(function(name){
                    isFunction(Test2.prototype[name]);
                })
            });

            it("instanceof will not return true for any of the parents", function(){
                var that = new mjs.mi.Test2();
                expect(that instanceof SuperClass).toBeFalsy();
                expect(that instanceof mjs.mi.Test1).toBeFalsy();
            });
        })
    });


    it("should contain only the expected members, nothing unexpected mixed in", function(){
        expect(SuperClass.isFunction).toBeUndefined();
    });


    describe("Any property whose name is all upper case should be a constant and static", function(){
        $.xp.Class("WTF").define({
            FIRST_ORDERED_NODE_TYPE: 'H1',
            CLASSNAME: 'wtf',
            size: 12,
            width: 45,
            initialize: function(args){
                $.extend(this, args);
            }
        });
        var instance;


        beforeEach(function(){
            instance = new WTF({ id: '3467', size: 56 });
        });

        it("should be immutable", function(){
            expect(56).toEqual(instance.size);
            expect('H1').toEqual(WTF.FIRST_ORDERED_NODE_TYPE);

            WTF.CLASSNAME = "Huh?";
            expect('wtf').toEqual(WTF.CLASSNAME);

            var another = new WTF({ FIRST_ORDERED_NODE_TYPE: 'table' });
            expect('H1').toEqual(WTF.FIRST_ORDERED_NODE_TYPE);
        });

        it("should not be deletable", function(){
            delete WTF.FIRST_ORDERED_NODE_TYPE;
            expect('H1').toEqual(WTF.FIRST_ORDERED_NODE_TYPE);

            delete WTF.CLASSNAME;
            expect('wtf').toEqual(WTF.CLASSNAME);
        });

    });


    describe("Any property whose names begin with an underscore should be private", function(){
        $.xp.Class("SomeMap").define({
            _items: null,
            initialize: function(args){
                this._items = $.extend({}, args);
            },
            put: function(k, v){
                this._items[k] = v;
            },
            get: function(k){
                return this._items[k];
            }
        });
        var map = new SomeMap({ firstName: "Philip", lastName: "Ford"});

        it("should not be accessible outside the class", function(){
            var items;
            try {
                items = map._items;
                this.fail("We should not reach this point.");
            } catch(e) {
               expect(items).toBeUndefined();
            }
        });

        it("should be retrievable within instance methods", function(){
            expect(map.get("firstName")).toEqual("Philip");
        });

        it("should be writable within instance methods", function(){
            try {
                map.put("ssn", "xxx-xx-xxxx");
                map.put("firstName", "Constantine");
            } catch(e) {
                this.fail("map.put() should not have thrown and error.");
            }
            expect(map.get("firstName")).toEqual("Constantine");
            expect(map.get("ssn")).toEqual("xxx-xx-xxxx");
        });

        it("should not be inherited", function(){
            $.xp.Class("SomeOtherMap").extend(SomeMap).define({
                getItems: function(){
                    return this._items;
                },

                get: function(key){
                    return this._items[key];
                }
            });

            try {
                expect(new SomeOtherMap().getItems()).toBeUndefined();
                this.fail("We should not reach this point.");
            } catch (e) {

            }

            var that = new SomeOtherMap();

            that.put("test", 1);
            try {
                expect(that.get("test")).toBeUndefined();
                this.fail("We should not reach this point.");
            } catch(e){

            }

        });

        it("should still be accessible from inherited methods", function(){
            $.xp.Class("SomeOtherMap").extend(SomeMap)
                .define({
                    getItems: function(){
                        return this._items;
                    }
                });

            var that = new SomeOtherMap();

            try {
                that.put("test", 1);
                expect(that.get("test")).toEqual(1);
            } catch(e){
                this.fail("We should not reach this point.");
            }

        });



        describe("_className", function(){
            $.xp.Class("mjs.test.SomeOtherMap").extend(SomeMap)
                .define({
                    _items: {},
                    _className: "mjs.test.SomeOtherMap",
                    put: function(key, value){
                        this._items[key] = value;
                    }
                });

            it("should be private", function(){
                try {
                    $.log(new mjs.test.SomeOtherMap()._className);
                    this.fail("We should not reach this point.");
                } catch(e){
                    expect(e.message.contains("mjs.test.SomeOtherMap")).toBeTruthy();
                }
            });

            it("should be accessible indirectly through getClassName()", function(){
                expect(new mjs.test.SomeOtherMap().getClassName()).toEqual("mjs.test.SomeOtherMap");
            });

            it("should be fully qualified and the enclosing package should be created automatically, if needed", function(){
                $.xp.Class("mjs.collections.xp.TreeSet").define({
                    _items: [],
                    add: function(value){
                        this._items.push(value)
                    }
                });
                expect(mjs.collections.xp.TreeSet).toBeDefined();
                expect(new mjs.collections.xp.TreeSet().getClassName()).toEqual("mjs.collections.xp.TreeSet");
            });
        })

    });



    describe("Each instance of classes produced by $.xp.Class()", function(){
        it("should contain only the expected members.", function(){
            expect(superClassObj.isFunction).toBeUndefined();
        });

        it("should have $super() for invoking parent-class constructor (initialize).", function(){
            var test = 3;
            var calls = 0;
            $.xp.Class("Category").define({
                initialize: function(id){
                    this.id = "Category: " + id;
                    test = this.id;
                    ++calls;
                }
            });
            $.xp.Class("Genus").extend(Category).define({
                initialize: function(id, name){
                    this.$super(id);
                    this.id = "Genus: " + id;
                    this.name = name;
                }
            });
            expect(test).toEqual(3);    // A control
            var genus = new Genus(5, "Horse");
            expect(test).toEqual("Category: " + 5);
            expect(genus.id).toEqual("Genus: " + 5);
            expect(genus.name).toEqual("Horse");
            expect(calls).toEqual(1);    // Just making sure that the super constructor was still only called once.
        });

        it("should have an inherited() method for invoking a super class method or for returning a superclas property.", function(){
            var msg = "This is a great message.";
            subClassObj.inherited("setMessage", msg);
            expect(subClassObj.message).toEqual(msg);
        });


        it("should NOT have prototypes, because instances aren't functions (like \"classes\" are).", function(){
            expect(superClassObj.prototype).toBeUndefined();
            expect(subClassObj.prototype).toBeUndefined();
            expect(subSubClassObj.prototype).toBeUndefined();
        });
    });


    describe("Each method within a class", function(){
        it("should know its own name", function(){
            expect(superClassObj.colorize.methodName).toEqual("colorize");
        });
    });
});
