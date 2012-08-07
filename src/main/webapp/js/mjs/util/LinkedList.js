/**
 * An implementation of a doubly-linked list.
 */

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
                current = parent.head,
                count = 0;
            var index = arguments.length > 1 ? arguments[0] : null;
            if (index){
                while(count++ < index){
                    current = current.next;
                    callback(current, count, parent);
                }
            } else {
                while(current.next){
                    current = current.next;
                    callback(current, count, parent);
                    ++count;
                }
            }
            return current;
        }
    });

    function ReverseIterator(that){
        this.parent = that;
    }
    $.extend(ReverseIterator.prototype, {
        forEach: function(callback){
            var index = arguments.length > 1 ? arguments[0] : null;
            var parent = this.parent,
                current = parent.tail,
                count = parent.size();
            if (index){
                while(count-- > index){
                    current = current.previous;
                    callback(current, count, parent);
                }
            } else {
                while(current.previous){
                    current = current.previous;
                    callback(current, count, parent);
                    --count;
                }
            }
            return current;
        }
    });



    /**
     *
     * @constructor
     */
    function LinkedList(){
        this.length = 0;
        this.head = null;
        this.tail = null;
        this.iterator = new Iterator(this);
        this.reverseIterator = new ReverseIterator(this);
    }
    Object.defineProperties(LinkedList.prototype, {
        length: { writable: true, configurable: false, enumerable: true },
        head: { writable: true, configurable: false, enumerable: false },
        tail: { writable: true, configurable: false, enumerable: false },
        iterator: { writable: true, configurable: false, enumerable: false },
        reverseIterator: { writable: true, configurable: false, enumerable: false }
    });
    $.extend(LinkedList.prototype, {
        getAt: function(index){
            var count = 0,
                current = this.head,
                result = null;
            if (count > -1 && index < this.length){
                while (count++ < index){
                    current = current.next;
                }
                result = current.value;
            }
            return result;
        },
        add: function(that){
            var item = new LinkedListItem(that);
            if (this.head == null){
                this.head = item;
            } else {
                var current = this.head;
                while (current.next){
                    current = current.next;
                }
                current.next = item;
                item.previous = current;
            }
            this.tail = item;
            ++this.length;
        },
        insertAt: function(index, that){
            var count = 0, previous, next,
                item = new LinkedListItem(that);
            if (this.head == null){
                this.head = item;
            } else {
                var current = this.head;
                while (count++ < index){
                    current = current.next;
                }
                insertLink(that, current.previous, current);
            }
            ++this.length;
        },
        toArray: function(){
            var result = [], current = this.head;
            while (current.next){
                result.push(current);
                current = current.next;
            }
            return result;
        },
        size: function(){
            return this.length;
        },
        getFirst: function(){
            return this.head.value;
        },
        getLast: function(){
            return this.tail.value;
        }
    });



    $.LinkedList = LinkedList;
})(mjs);