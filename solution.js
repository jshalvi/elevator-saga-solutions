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
            elevator.setDirection = function (direction) {
                this.goingUp = direction === 'up';
                this.goingUpIndicator(this.goingUp);
                this.goingDownIndicator(!this.goingUp);
            };
            elevator.nextQueue = [];
            elevator.setQueue = function (queue) {
                this.destinationQueue = queue;
                this.destinationQueue.sort(this.goingUp ? asc : desc);
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
            };

            elevator.setScheduler = function(scheduler) {
                this.scheduler = scheduler;
            };
            
            elevator.on("idle", function() {

                if (this.nextQueue) {
                    this.setQueue(this.nextQueue);
                    this.nextQueue = [];
                }

                var poll = function () {

                    var newQueue = this.scheduler.getQueue(this);

                    if (newQueue.queue.length > 0) {
                        this.setDirection(newQueue.direction);
                        this.setQueue(newQueue.queue);
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
            this.nextDirection = 'up';

            var that = this;
            var onUpButtonPressed = function () {
                that.upQueue.add(this.floorNum());
                console.log('pushed ' + this.floorNum(), that.upQueue.toArray(), that.downQueue.toArray());
            };
            var onDownButtonPressed = function () {
                that.downQueue.add(this.floorNum());
                console.log('pushed ' + this.floorNum(), that.upQueue.toArray(), that.downQueue.toArray());
            };

            for (i = 0, len = floors.length; i < len; i++) {
                floor = floors[i];
                floor.on('up_button_pressed', onUpButtonPressed);
                floor.on('down_button_pressed', onDownButtonPressed);
            }
        }
        Scheduler.prototype.getQueue = function(elevator) {
                    
            var direction, queue;

            if (!this.upQueue.empty() && !elevator.goingUp) {

                queue = this.upQueue.toArray();
                direction = 'up';
                this.upQueue = new PQ(true);
                this.nextDirection = 'down';

            } else if (!this.downQueue.empty()) {

                queue = this.downQueue.toArray();
                direction = 'down';
                this.nextDirection = 'up';
                this.downQueue = new PQ();

            } else {

                queue = [];
            }

            return {
                direction: direction,
                queue: queue
            };
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
