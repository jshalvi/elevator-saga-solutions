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
        var UP = 'up',
            DOWN = 'down',
            IDLE = 'idle';

        function initElevator (elevator) {

            elevator.goingUp = true;
            elevator.direction = IDLE;

            elevator.goingDownIndicator(false);
            elevator.goingUpIndicator(true);
            elevator.setDirection = function (direction) {
                this.goingUp = direction === UP;
                this.direction = direction;
                this.goingUpIndicator(direction === UP);
                this.goingDownIndicator(direction === DOWN);
            };
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
            elevator.stopRequested = function (floorNum) {

                if (this.goingUp) {
                    if (floorNum > this.currentFloor()) {
                        this.queueDestination(floorNum);
                    }
                } else {
                    if (floorNum < this.currentFloor()) {
                        this.queueDestination(floorNum);
                    }
                }

                this.scheduler.clearStop(floorNum, this.goingUp ? 'up' : 'down');
            };

            elevator.setScheduler = function(scheduler) {
                this.scheduler = scheduler;
            };
            
            elevator.on('passing_floor', function(floor, direction) {
                
                // TODO - need a more scalable way to distribute pickups than simple mods
                if (this.loadFactor() < 0.7 && this.id % 2 == floor % 2 && this.scheduler.stopAtFloor(floor, direction)) {
                    var newQueue =[floor].concat(this.destinationQueue); 

                    this.setQueue(newQueue);
                }
            });

            elevator.on('idle', function() {

                elevator.setDirection(IDLE);

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

            this.upQueue = [];
            this.downQueue = [];
            this.nextDirection = 'up';

            var that = this;
            var onUpButtonPressed = function () {
                if (that.upQueue.indexOf(this.floorNum()) === -1) {
                    that.upQueue.push(this.floorNum());
                }
            };
            var onDownButtonPressed = function () {
                if (that.downQueue.indexOf(this.floorNum()) === -1) {
                    that.downQueue.push(this.floorNum());
                }
            };

            for (i = 0, len = floors.length; i < len; i++) {
                floor = floors[i];
                floor.on('up_button_pressed', onUpButtonPressed);
                floor.on('down_button_pressed', onDownButtonPressed);
            }
        }
        Scheduler.prototype.getDirectionalQueue = function(direction) {
            return direction === 'up' ? this.upQueue : this.downQueue;
        };
        Scheduler.prototype.clearStop = function(floor, direction) {

            var idx, queue;
            queue = this.getDirectionalQueue(direction);
            idx = queue.indexOf(floor);

            if (idx > -1) {
                queue.splice(idx, 1);
            }
        };
        Scheduler.prototype.stopAtFloor = function(floor, direction) {

            var idx, queue;

            queue = this.getDirectionalQueue(direction);

            idx = queue.indexOf(floor);

            if (idx > -1) {
                queue.splice(idx, 1);
                return true;
            }

            return false;
        };
        Scheduler.prototype.getQueue = function(elevator) {
                    
            var direction, queue = [];

            if (elevator.currentFloor() !== 0) {

                var maxPressed;

                var max = function (prev, curr) {
                    if (prev === undefined) {
                        return curr;
                    } else {
                        return curr > prev ? curr : prev;
                    }
                };

                // find max pickUp among elevators
                var highestPressed = elevator.getPressedFloors().reduce(max, -1);

                var highestPressedGlobal = elevators.map(function (el) {
                    return el.getPressedFloors().reduce(max, -1);
                }).reduce(max, -1);

                var highestDown = this.downQueue.reduce(max, -1);

                if (highestPressedGlobal < highestDown) {

                    this.clearStop(highestDown, DOWN);
                    direction = DOWN;
                    queue = [highestDown, 0]; 

                } else {

                    var currentFloor = elevator.currentFloor();
                    this.clearStop(currentFloor, DOWN);
                    direction = DOWN;
                    queue = [currentFloor, 0];

                }

            } else {

                if (this.upQueue.indexOf(0) !== -1) {

                    direction = UP;
                    queue = [0];

                } else if (this.downQueue.length > 0) {

                    var highestFloor = this.downQueue.reduce(function (prev, curr) {
                        return prev > curr ? prev : curr;
                    }, this.downQueue[0]);

                    this.clearStop(highestFloor, DOWN);

                    direction = DOWN;
                    queue = [highestFloor];

                } else {

                    direction = IDLE;
                    queue = [];
                }
            }
            
            return {
                direction: direction,
                queue: queue
            };
        };

        var scheduler = new Scheduler(floors);

        for (i = 0, len = elevators.length; i < len; i++) {
            elevators[i] = initElevator(elevators[i]);
            elevators[i].setScheduler(scheduler);
            elevators[i].id = i;
        }
        
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
;
