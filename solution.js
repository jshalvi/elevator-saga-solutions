/* jshint unused: false */
/* global window */
var foo =
{
    init: function(elevators, floors) {
        var i, len, floor;
        var elevator;
        var upQueue, downQueue;
        var desc = function (a, b) { // reverse comparator
            return b - a;
        };
        var asc = function (a, b) {
            return a - b;
        };

        function initElevator (elevator) {

            elevator.goingUp = true;
            elevator.toggleDirection = function () {
                this.goingUp = !this.goingUp;
                
            };
            elevator.nextQueue = [];
            elevator.setQueue = function (queue) {
                this.destinationQueue = queue;
                this.checkDestinationQueue();
            };
            elevator.queueDestination = function (floorNum) {
                if (this.destinationQueue.indexOf(floorNum) === -1) {
                    this.destinationQueue.push(floorNum);
                    this.destinationQueue.sort(this.goingUp ? asc : desc);
                    this.checkDestinationQueue();
                }
            };
            elevator.queueNextDestination = function (floorNum) {
                if (this.nextQueue.indexOf(floorNum) === -1) {
                    this.nextQueue.push(floorNum);
                    this.nextQueue.sort(this.goingUp ? asc : desc);
                }
            };
            elevator.stopRequested = function (floorNum) {

                if (this.goingUp) {
                    if (floorNum > this.currentFloor()) {
                        this.queueDestination(floorNum);
                    } else {
                        this.queueNextDestination(floorNum);
                    }
                } else {
                    if (floorNum < this.currentFloor()) {
                        this.queueDestination(floorNum);
                    } else {
                        this.queueNextDestination(floorNum);
                    }
                }
                console.log('stop requested', this.goingUp ? 'up' : 'down', 'dest', this.destinationQueue, 'next', this.nextQueue);
            };
            
            elevator.on("idle", function() {

                this.toggleDirection();

                console.log('IDLE');

                if (this.nextQueue.length > 0) {
                    console.log('flushing queue', this.nextQueue);
                    this.destinationQueue = this.nextQueue;
                    this.destinationQueue.sort(this.goingUp ? asc : desc);
                    this.nextQueue = [];
                    this.checkDestinationQueue();
                    return;
                }
                // if next queue is available
                    // flush it
                    // return
                    // TODO - merge with next direction


                var that = this;
                var poll = function () {
                    console.log('polling', that.goingUp, upQueue.empty(), downQueue.empty());
                    if (that.goingUp && !upQueue.empty()) {
                        that.setQueue(upQueue.toArray());
                        upQueue = new PQ(true); // TODO - elevator shouldn't be doing this
                    } else if (!that.goingUp && !downQueue.empty()) {
                        that.setQueue(downQueue.toArray());
                        downQueue = new PQ(); // TODO - elevator shouldn't be doing this
                    } else {
                        that.toggleDirection();
                        window.setTimeout(poll, 0);
                    }
                };

                window.setTimeout(poll, 0);
            });

            elevator.on('floor_button_pressed', function (floorNum) {
                this.stopRequested(floorNum);
            });

            return elevator;
        }

        function PQ (goingUp) {
            this.goingUp = goingUp === undefined ? false : true;
            this.items = [];
        }
        PQ.prototype.add = function (floorNum) {
            if (this.items.indexOf(floorNum) === -1) {
                this.items.push(floorNum);
                var that = this;

                var direction = this.goingUp ? 1 : -1;

                this.items.sort(function (a, b) {
                    return direction * (a - b);
                });
            }
        };
        PQ.prototype.empty = function () {
            return this.items.length === 0;
        };
        PQ.prototype.toArray = function () {
            return this.items;
        };

        upQueue = new PQ(true);
        downQueue = new PQ();


        var onUpButtonPressed = function () {
            // elevator.stopRequested(this.floorNum());
            upQueue.add(this.floorNum());
            console.log('up button pressed', this.floorNum(), 'upQueue', upQueue.items);
        };

        var onDownButtonPressed = function () {
            // elevator.stopRequested(this.floorNum());
            downQueue.add(this.floorNum());
            console.log('down button pressed', this.floorNum(), 'downQueue', downQueue.items);
        };

        for (i = 0, len = elevators.length; i < len; i++) {
            elevators[i] = initElevator(elevators[i]);
        }
        
        for (i = 0, len = floors.length; i < len; i++) {
            floor = floors[i];
            floor.on('up_button_pressed', onUpButtonPressed);
            floor.on('down_button_pressed', onDownButtonPressed);
        }
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
;
