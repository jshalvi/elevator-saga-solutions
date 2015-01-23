{
    init: function(elevators, floors) {
        var elevator = elevators[0]; // Let's use the first elevator

        elevator.stopRequested = function (floorNum) {

            console.log('stop requested', floorNum, this.destinationQueue.indexOf(floorNum));
            if (this.destinationQueue.indexOf(floorNum) === -1) {
                this.destinationQueue.push(floorNum);
                this.checkDestinationQueue();
            }
        };
        
        elevator.on("idle", function() {
            // The elevator is idle, so let's go to all the floors (or did we forget one?)
            // this.goToFloor(4);
        });

        elevator.on('floor_button_pressed', function (floorNum) {
            this.stopRequested(floorNum);
        });
        
        var onUpButtonPressed = function () {
            elevator.stopRequested(this.floorNum());
        };

        var onDownButtonPressed = function () {
            elevator.stopRequested(this.floorNum());
        };

        var i, len, floor;
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
