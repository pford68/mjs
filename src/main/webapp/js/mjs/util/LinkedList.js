
(function($){

    $.require("mjs/core/oop");
    $.require("mjs/core/interfaces");


    function insertLink(that, previous, next){
        previous.next = that;
        that.next = next;
        that.previous = previous;
        next.previous = that;
    }

    /*

     */
    function LinkedListItem(that, previous, next){
        if (previous) {
            this.previous = previous;
            previous.next = that;
        }
        if (next){
            this.next = next;
            next.previous = that;
        }
        this.value = that;
    }
    Object.defineProperties(LinkedListItem.prototype, {
        previous: { writable: true, configurable: true, enumerable: true },
        next: { writable: true, configurable: true, enumerable: true }
    });


    function Iterator(that){
        if (!that) return;
        this.parent = that;
        this.reset();
    }
    $.extend(Iterator.prototype, {
        next: function(){
            this.current = this.current.next;
            ++this.currentIndex;
            return this.current;
        },
        hasNext: function(){
            return this.current.next != null;
        },
        reset: function(){
            this.currentIndex = -1;
            this.current = { next: this.parent.peekFirst() };
        },
        getCurrentIndex: function(){
            return this.currentIndex;
        }
    });

    function ReverseIterator(that){
        this.parent = that;
        this.reset();
    }
    ReverseIterator.prototype = new Iterator();
    $.extend(ReverseIterator.prototype, {
        next: function(){
            this.current = this.current.previous;
            --this.currentIndex;
            return this.current;
        },
        hasNext: function(){
            return this.current.previous != null;
        },
        reset: function(){
            var p = this.parent;
            this.currentIndex = p.size();
            this.current = { previous: p.peekLast() };
        }
    });

    /*
    I like this interface-wise.  Traverse the list in reverse with list.reverse.forEach(...).
     */
    function Reverse(that){
        this.parent = that;
    }
    $.extend(Reverse.prototype,{
        forEach: function(callback){
            var m = this.parent.getIterator();
            this.parent.setIterator(ReverseIterator);
            this.parent.forEach(callback);
            this.parent.setIterator(m);
        }
    });



    /**
     * <p>
     *     An implementation of a doubly-linked list.  The idea is to allow quick insertion and deletion.
     * </p>
     * <p>
     *     Features include:
     *      <ul>
     *          <li>Iterate through the items using either the iterator property or the rightIterator property, which
     *              iterates in reverse order.</li>
     *          <li>Insert at a given index in the list, or remove an item at a given index.</li>
     *          <li>Retrieve an item at a given index.</li>
     *          <li>Duplicates are allowed.</li>
     *  </ul>
     * </p>
     * <p>
     *    Honestly, have I ever really needed a LinkedList in JavaScript?  No, but at times I have thought I
     *    <strong>might</strong> need one, though that ended up not being true. I think the issue will hinge on
     *    whether insertAt()/removeAt() are faster than Array.prototype.splice(), a question which I have not
     *    yet tested.
     * </p>
     */
    var LinkedList = $.Class({
        /*
         Note: A result of making _head and _tail private is that they aren't accessible in the Iterators.
         */
        _length: 0,
        _head: null,
        _tail: null,
        _iterator: null,
        _className: 'mjs.util.LinkedList',
        reverse: null,

        /**
         *
         * @param [args]
         */
        initialize: function(args){
            // The following three properties have to be reinitialized for every instance,
            // or else they are shared by all.
            this._length = 0;
            this._head = null;
            this._tail = null;

            this._iterator = (args && args._iterator) || Iterator;
            this.reverse = new Reverse(this);
        },
        /**
         * Retrieves the item at the specified index.
         *
         * @param index
         * @return {*}
         */
        getAt: function(index){
            var count = 0,
                current = this._head,
                result = null;
            if (index < this._length){
                while (count++ < index){
                    current = current.next;
                }
                result = current.value;
            }
            return result;
        },
        /**
         * Adds the specified item to the tail of the list.
         * @param that
         */
        add: function(that){
            var item = new LinkedListItem(that);
            if (this._head == null){
                this._head = item;
            } else {
                var current = this._tail;
                current.next = item;
                item.previous = current;
            }
            this._tail = item;
            ++this._length;
        },
        /**
         * Inserts the specified item at the specified index.
         *
         * @param index
         * @param that
         */
        insertAt: function(index, that){
            var count = 0,
                item = new LinkedListItem(that);

            if (this._head == null){
                // This also means that the list was empty, so the index is ignored
                // and the code in the else clause is irrelevant.
                this._head = item;
            } else {
                var current = this._head;
                while (count++ < index){
                    current = current.next;
                }
                insertLink(item, current.previous, current);
            }
            ++this._length;
        },
        /**
         * Removes the item at the specified index.
         * @param index
         */
        removeAt: function(index){
            var count = 0,
                current = this._head;
            if (!this._head) return;   // This should mean that the list is empty.

            while (count++ < index){
                current = current.next;
            }
            if (index == 0) this._head = current.next;
            if (index == this._length -1) this._tail = current.previous;
            current.previous.next = current.next;
            current.next.previous = current.previous;
            --this._length;
        },
        /**
         * Converts the list to an array.
         * @return {Array}
         */
        toArray: function(){
            var result = [], current = this._head;
            while (current.next){
                result.push(current);
                current = current.next;
            }
            return result;
        },
        /**
         * Returns the number of items in the list.
         * @return {Number}
         */
        size: function(){
            return this._length;
        },
        /**
         * Returns the <strong>value</strong> of the head of the list.
         * @return {*}
         */
        getFirst: function(){
            return this._head.value;
        },
        /**
         * Returns the <strong>value</strong> of the tail of the list.
         * @return {*}
         */
        getLast: function(){
            return this._tail.value;
        },
        /**
         * Returns the LinkedListItem at the head of the list.
         * @return {*}
         */
        peekFirst: function(){
            return this._head;
        },
        /**
         * Returns the LinkedListItem at the tail of the list.
         * @return {*}
         */
        peekLast: function(){
            return this._tail;
        },
        /**
         * Executes a function for each item in the list.
         *
         * @param callback
         */
        forEach: function(callback){
            /*
            I opted for an iterator pattern to enable flexible traversing, but the relative
            complexity of the iterator, compared with the succinct speedy while loop in
            getAt(), for example, makes me think this may prove to be a mistake.
             */
            var it = new this._iterator(this);    // "it" should be destroyed when the function exits.
            while(it.hasNext()){
                callback(it.next(), it.getCurrentIndex(), this);
            }
        },
        /**
         *
         * @param iterator
         */
        setIterator: function(iterator){
            Object.implement(iterator.prototype, $.ListIterator);
            this._iterator = iterator;
            return this;
        },
        getIterator: function(){
            return this._iterator;
        }
    }).implement($.Iterable);



    $.extend({
        iterators: {
            LinkedList: {
                Left: Iterator,
                Right: ReverseIterator
            }
        }
    });


    $.util.LinkedList = LinkedList;

})(mjs);