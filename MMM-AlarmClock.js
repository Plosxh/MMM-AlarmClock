/* Magic Mirror
 * Module: MMM-AlarmClock
 *
 * By fewieden https://github.com/fewieden/MMM-AlarmClock
 * MIT Licensed.
 */

Module.register("MMM-AlarmClock", {

    next: null,
    alarmFired: false,

    defaults: {
        sound: 'alarm.mp3',
        touch: false,
        display: true,
        format: "ddd, h:mmA",
        timer: 60 * 1000 // one minute
    },

    getStyles: function () {
        return ["font-awesome.css", "MMM-AlarmClock.css"];
    },

    getScripts: function() {
        return ["moment.js"];
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        this.setNextAlarm();
        setInterval(() => {
            this.checkAlarm();
        }, 1000);
        moment.locale(config.language);
    },

    checkAlarm: function(){
        if(this.next && moment().diff(this.next.moment) >= 0){
            var alert = {
                imageFA: 'bell-o',
                message: this.next.message,
                timer: this.config.timer
            };
            if(!this.config.touch){
                alert.timer = this.config.timer;
            }
            if(this.next.hasOwnProperty("sender")){
                alert.title = this.next.sender;
            }
            this.sendNotification("SHOW_ALERT", alert);
            this.alarmFired = true;
            this.updateDom(300);
            if(!this.config.touch){
                setTimeout(() => {
                    this.resetAlarmClock();
                }, this.config.timer);
            }
        }
    },

    setNextAlarm: function(){
        this.next = null;
        for(var i = 0; i < this.config.alarms.length; i++){
            var temp = this.getMoment(this.config.alarms[i]);
            if(!this.next || temp.diff(this.next.moment) < 0){
                this.next = this.config.alarms[i];
                this.next.moment = temp;
            }
        }
        this.updateDom(300);
    },

    resetAlarmClock: function(){
        this.alarmFired = false;
        if(this.config.touch){
            this.sendNotification("HIDE_ALERT");
        }
        this.setNextAlarm();
    },

    getMoment: function(alarm){
        var now = moment();
        var difference = Math.min();

        for(var i = 0; i < alarm.days.length; i++){
            if(now.day() < alarm.days[i]){
                difference = Math.min(alarm.days[i] - now.day(), difference);
            } else if(now.day() === alarm.days[i] && (parseInt(now.hour()) < alarm.hour || parseInt(now.hour()) === alarm.hour && parseInt(now.minute()) <= alarm.minute)){
                difference = Math.min(0, difference);
            } else if(now.day() === alarm.days[i]){
                difference = Math.min(7, difference);
            } else {
                difference = Math.min(6 - now.day() + alarm.days[i], difference);
            }
        }

        return moment().add(difference, 'days').set({
            hour: parseInt(alarm.time.split(":")[0]),
            minute: parseInt(alarm.time.split(":")[1]),
            second: 0,
            millisecond: 0
        });
    },



    getDom: function () {

        var wrapper = document.createElement("div");
        var header = document.createElement("header");
        header.classList.add("align-left");

        var logo = document.createElement("i");
        logo.classList.add("fa", "fa-bell-o", "logo");
        header.appendChild(logo);

        var name = document.createElement("span");
        name.innerHTML = this.translate("ALARM_CLOCK") + this.next ? " " + this.next.moment.format(this.config.format) : "";
        header.appendChild(name);
        wrapper.appendChild(header);

        if (!this.next) {
            var text = document.createElement("div");
            text.innerHTML = this.translate("LOADING");
            text.classList.add("dimmed", "light");
            wrapper.appendChild(text);
        } else if(this.alarmFired) {
            var sound = document.createElement("audio");
            sound.src = this.file("sounds/" + this.config.sound);
            sound.setAttribute("autoplay", true);
            sound.setAttribute("loop", true);
            wrapper.appendChild(sound);

            if(this.config.touch){
                var button = document.createElement("div");
                button.classList.add("button", "medium");
                button.addEventListener("click", this.resetAlarmClock);
                button.innerHTML = this.translate("TURN_OFF");
                wrapper.appendChild(button);
            }
        } else {
            var alarm = document.createElement("div");
            alarm.innerHTML = this.next.message;
            wrapper.appendChild(alarm);
        }

        return wrapper;
    }
});