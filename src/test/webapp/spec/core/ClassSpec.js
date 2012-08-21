describe("mjs.Class() suite", function() {
    var $ = mjs;

    $.require("mjs/core/oop");

    var classBody, body, SuperClass, SubClass, SubSubClass,
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

        SuperClass = $.Class(body);
        SubClass = $.Class(SuperClass, {
            initialize: function(args) {
                if (args) this.id = "__subclass" + args.id + "__";
            },
            setMessage: function(msg) {
                this.message = 2 + 2 + msg;
            },
            newMethod: function() {
            }
        });
        SubSubClass = $.Class(SubClass, {});
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

        it("A default constructor should be created if no initialize() method is passed to $.Class()", function(){
            var MyGreatClass = $.Class({
                kill: function(){}
            });
            expect(MyGreatClass.prototype.initialize).toBeDefined();
        });

        it("The parameter-less constructor of the parent class should be called when a subclass' constructor is invoked with the \"new\" keyword.", function(){
            /*
            Below if the parent class constructor has been invoked, properties set by the parent constructor
            should have the values set by that constructor, unless reset by the subclass constructor.
             */
            var MyGreatClass = $.Class({
                id: null,
                initialize: function(){
                    this.id = 5;
                }
            });
            var MyGreatSubClass = $.Class(MyGreatClass, {});
            var instance = new MyGreatSubClass();
            expect(instance.id).toEqual(5);

            var MyGreatSubClass2 = $.Class(MyGreatClass, { id: 3, initialize: function(){ this.age = 6; } });
            var instance2 = new MyGreatSubClass2();
            expect(instance2.id).toEqual(5);
        });

        it("The subclass constructor should override settings made by the parent constructor.", function(){
            /*
            Below if the parent class constructor has been invoked, properties set by the parent constructor
            should have the values set by that constructor, unless reset by the subclass constructor.
             */
            var MyGreatClass = $.Class({
                id: null,
                initialize: function(){
                    this.id = 5;
                }
            });
            // In this case, the subclass has a constructor that overrides the settings made by the parent constructor.
            var MyGreatSubClass = $.Class(MyGreatClass, { initialize: function(id){ this.id = id; } });
            var instance = new MyGreatSubClass(6);
            expect(instance.id).toEqual(6);
        });

        it("Superclass constructors that have parameters should not be called automatically.", function(){
            var MyGreatClass = $.Class({
                id: "MyGreatClass_1001",
                msg: "my constructor has parameters",
                initialize: function(id){
                    throw new Error("This constructor should not have been called.");
                }
            });

            var MyGreatSubClass = $.Class(MyGreatClass, { });
            try {
                var instance = new MyGreatSubClass();
            } catch(e){
                this.fail("We should not reach this point:  " + e.message);
            }
        });

        it("Unlike Java, no error should be thrown if parent has no parameter-less constructor.", function(){

        });


         it("Constructors (and parent class constructors) should not be called more than once during initialization.", function(){
            var MyGreatClass = $.Class({
                id: 2,
                initialize: function(id){
                    this.id *= 2;
                }
            });
            var MyGreatSubClass = $.Class(MyGreatClass, { initialize: function(){
                this.$super(0);
            } });
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
    });


    it("should contain only the expected members, nothing unexpected mixed in", function(){
        expect(SuperClass.isFunction).toBeUndefined();
    });


    describe("Any property whose name is all upper case should be a constant", function(){
        var WTF = $.Class({
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
            expect('H1').toEqual(instance.FIRST_ORDERED_NODE_TYPE);

            instance.CLASSNAME = "Huh?";
            expect('wtf').toEqual(instance.CLASSNAME);

            var another = new WTF({ FIRST_ORDERED_NODE_TYPE: 'table' });
            expect('H1').toEqual(another.FIRST_ORDERED_NODE_TYPE);
        });

        it("should not be deletable", function(){
            delete instance.FIRST_ORDERED_NODE_TYPE;
            expect('H1').toEqual(instance.FIRST_ORDERED_NODE_TYPE);

            delete instance.CLASSNAME;
            expect('wtf').toEqual(instance.CLASSNAME);
        });

        /*  No longer added constants to the prototype.
        it("should not be deletable/editable from the prototype either", function(){
            delete WTF.prototype.FIRST_ORDERED_NODE_TYPE;
            expect('H1').toEqual(WTF.prototype.FIRST_ORDERED_NODE_TYPE);

            delete WTF.prototype.CLASSNAME;
            expect('wtf').toEqual(WTF.prototype.CLASSNAME);

            WTF.prototype.CLASSNAME = "A";
            expect('wtf').toEqual(WTF.prototype.CLASSNAME);
        });
        */
    });


    describe("Any property whose names begin with an underscore should be private", function(){
        var SomeMap = $.Class({
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
            var SomeOtherMap = $.Class(SomeMap, {
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
            var SomeOtherMap = $.Class(SomeMap, {
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
            var SomeOtherMap = $.Class(SomeMap, {
                _className: "mjs.test.SomeOtherMap"
            });

            it("should be private", function(){
                try {
                    $.log(new SomeOtherMap()._className);
                    this.fail("We should not reach this point.");
                } catch(e){
                    expect(e.message.contains("mjs.test.SomeOtherMap")).toBeTruthy();
                }
            });

            it("should be accessible indirectly through getClassName()", function(){
                expect(new SomeOtherMap().getClassName()).toEqual("mjs.test.SomeOtherMap");
            });
        })

    });



    describe("Each instance of classes produced by $.Class()", function(){
        it("should contain only the expected members.", function(){
            expect(superClassObj.isFunction).toBeUndefined();
        });

        it("should have $super() for invoking parent-class constructor (initialize).", function(){
            var test = 3;
            var calls = 0;
            var Category = $.Class({
                initialize: function(id){
                    this.id = "Category: " + id;
                    test = this.id;
                    ++calls;
                }
            });
            var Genus = $.Class(Category, {
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
    })
});
