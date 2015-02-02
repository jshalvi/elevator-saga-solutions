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

            elevator.goingDownIndicator(false);
            elevator.goingUpIndicator(true);
            elevator.toggleDirection = function () {
                this.goingUp = !this.goingUp;
                this.goingUpIndicator(this.goingUp);
                this.goingDownIndicator(!this.goingUp);
            };
            elevator.nextQueue = [];
            elevator.setQueue = function (queue) {
                console.log('queue (setQueue)', queue);
                this.destinationQueue = queue;
                this.destinationQueue.sort(this.goingUp ? asc : desc);
                this.checkDestinationQueue();
            };
            elevator.queueDestination = function (floorNum) {
                if (this.destinationQueue.indexOf(floorNum) === -1) {
                    console.log('queue (queueDestination)', this.destinationQueue);
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
            };

            elevator.setScheduler = function(scheduler) {
                this.scheduler = scheduler;
            };
            
            elevator.on("idle", function() {


                var poll = function () {

                    this.toggleDirection();

                    var newQueue = this.scheduler.getQueue(this);

                    if (newQueue.length > 0) {
                        this.setQueue(newQueue);
                    } else {
                        window.setTimeout(poll, 0);
                    }
                }.bind(this);
                poll();
            });

            elevator.on('floor_button_pressed', function (floorNum) {
                this.stopRequested(floorNum);
            });

            return elevator;
        }

        function Scheduler (floors) {

            this.upQueue = new PQ(true);
            this.downQueue = new PQ();

            var that = this;
            var onUpButtonPressed = function () {
                that.upQueue.add(this.floorNum());
            };
            var onDownButtonPressed = function () {
                that.downQueue.add(this.floorNum());
            };

            for (i = 0, len = floors.length; i < len; i++) {
                floor = floors[i];
                floor.on('up_button_pressed', onUpButtonPressed);
                floor.on('down_button_pressed', onDownButtonPressed);
            }
        }
        Scheduler.prototype.getQueue = function(elevator) {
                    
            var queue;

            if (elevator.goingUp && !this.upQueue.empty()) {
                queue = this.upQueue.toArray();
                this.upQueue = new PQ(true);
                console.log('returning upQueue');
            } else if (!elevator.goingUp && !this.downQueue.empty()) {
                queue = this.downQueue.toArray();
                this.downQueue = new PQ();
                console.log('returning downQueue');
            } else {
                queue = [];
            }

            // TODO add direction
            return queue;
        };


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

        var scheduler = new Scheduler(floors);

        for (i = 0, len = elevators.length; i < len; i++) {
            elevators[i] = initElevator(elevators[i]);
            elevators[i].setScheduler(scheduler);
        }
        
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
;
