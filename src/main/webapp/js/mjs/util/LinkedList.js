
(function($){

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
    }
    $.extend(Iterator.prototype, {
        forEach: function(callback){
            var parent = this.parent,
                current = parent.peekFirst(),
                count = 0;
            var index = arguments.length > 1 ? arguments[0] : parent.size();
            while(count++ < index){
                callback(current, count, parent);
                current = current.next;
            }
            return current;
        }
    });

    function ReverseIterator(that){
        this.parent = that;
    }
    $.extend(ReverseIterator.prototype, {
        forEach: function(callback){
            var index = arguments.length > 1 ? arguments[0] : 0;
            var parent = this.parent,
                current = parent.peekLast(),
                count = parent.size();
            while(count-- > index){
                callback(current, count, parent);
                current = current.previous;
            }
            return current;
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
    $.util.LinkedList = $.Class({
        /*
         Note: A result of making _head and _tail private is that they aren't accessible in the Iterators.
         */
        _length: 0,
        _head: null,
        _tail: null,
        iterator: null,
        rightIterator: null,
        
        initialize: function(){
            // The following three properties have to be reinitialized for every instance,
            // or else they are shared by all.
            this._length = 0;
            this._head = null;
            this._tail = null;

            this.iterator = new Iterator(this);
            this.rightIterator = new ReverseIterator(this);
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
        }
    });

})(mjs);