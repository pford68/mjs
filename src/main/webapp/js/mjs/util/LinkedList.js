
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
        this.parent = that;
        this.currentIndex = 0;
    }
    $.extend(Iterator.prototype, {
        next: function(){
            var parent = this.parent,
                current = parent.peekFirst(),
                index = this.currentIndex,
                count = 0;
            while(count++ < index){
                current = current.next;
            }

            this.currentIndex = count;
            return current;
        },
        hasNext: function(){
            return this.currentIndex < this.parent.size();
        },
        reset: function(){
            this.currentIndex = 0;
        }
    });

    function ReverseIterator(that){
        this.parent = that;
        this.currentIndex = that.size() - 1;
    }
    ReverseIterator.prototype = new Iterator();
    $.extend(ReverseIterator.prototype, {
        next: function(){
            var parent = this.parent,
                index = this.currentIndex,
                current = parent.peekLast(),
                count = parent.size() - 1;
            while(count-- > index){
                current = current.previous;
            }
            this.currentIndex = count;
            return current;
        },
        hasNext: function(){
            return this.currentIndex >= 0;
        },
        reset: function(){
            this.currentIndex = this.parent.size() - 1;
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
            if (count > -1 && index < this._length){
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
            $.log("LinkedList item").log(item);
            if (this._head == null){
                this._head = item;
            } else {
                var current = this._head;
                while (current.next){
                    current = current.next;
                }
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
        forEach: function(callback){
            /*
            My decision to use an iterator pattern will probably slow forEach down
            (because of the double while loop) and may  be ill-conceived for that reason.
            But I'll keep it for now.
             */
            var it = new this._iterator(this);
            while(it.hasNext()){
                callback(it.next(), it.currentIndex, this);
            }
        },
        setIterator: function(iterator){
            Object.implement(iterator.prototype, $.Iterator);
            this._iterator = iterator;
        }
    }).implement($.Iterable);


    $.extend(LinkedList, {
        iterators: {
            Left: Iterator,
            Right: ReverseIterator
        }
    });


    $.util.LinkedList = LinkedList;

})(mjs);