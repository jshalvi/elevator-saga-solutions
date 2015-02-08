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

                this.scheduler.clearStop(floorNum, this.goingUp ? 'up' : 'down');
            };

            elevator.setScheduler = function(scheduler) {
                this.scheduler = scheduler;
            };
            
            elevator.on('passing_floor', function(floor, direction) {
                
                if (this.loadFactor() < 0.8 && this.scheduler.stopAtFloor(floor, direction)) {
                    var newQueue =[floor].concat(this.destinationQueue); 

                    this.setQueue(newQueue);
                }
            });

            elevator.on('idle', function() {

                var poll = function () {

                    var newQueue = this.scheduler.getQueue(this);

                    if (newQueue.queue.length > 0) {
                        console.log('received queue', newQueue.direction, newQueue.queue);
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
                console.log('pushed ' + this.floorNum() + ' up', that.upQueue, that.downQueue);
            };
            var onDownButtonPressed = function () {
                if (that.downQueue.indexOf(this.floorNum()) === -1) {
                    that.downQueue.push(this.floorNum());
                }
                console.log('pushed ' + this.floorNum() + ' down' , that.upQueue, that.downQueue);
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
            var next = this.nextQueue;

            if (elevator.nextQueue.length > 0) {
                direction = elevator.goingUp ? 'up' : 'down';
                queue = elevator.nextQueue;
                elevator.nextQueue = [];
            } else if (elevator.currentFloor() !== 0) {
                direction = 'down';
                queue = this.downQueue.splice(0, 1);

                if (queue.length === 0) {
                    direction = 'up';
                    queue = [0];
                }
            } else {

                if (this.upQueue.indexOf(0) === -1 && this.downQueue.length > 0) {
                    console.log('going up...');
                    var highestFloor = this.downQueue.reduce(function (prev, curr) {
                        return prev > curr ? prev : curr;
                    }, this.downQueue[0]);

                    this.downQueue.splice(this.downQueue.indexOf(highestFloor), 1);
                    

                    direction = 'down';
                    queue = [highestFloor];

                } else {
                    direction = 'up';
                    queue = [0];
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
        }
        
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
;
