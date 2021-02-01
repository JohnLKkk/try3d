/**
 * 观察者模型,事件触发器。
 * @author Kkk
 * @date 2021年2月1日16点03分
 */
export default class Events{
    constructor(object){
        this.object = object;
		this.listeners = {};
    }
    removeA(arr) {
        let what,
            a = arguments,
            L = a.length,
            ax;
        while (L > 1 && arr.length) {
            what = a[--L];
            while ((ax = arr.indexOf(what)) !== -1) {
                arr.splice(ax, 1);
            }
        }
        return arr;
    }
    isset(variable) {
        for (let i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] == 'undefined' || arguments[i] == null) {
                return false;
            }
        }
        return true;
    }
    isArray(variable) {
        return Object.prototype.toString.call(variable) === '[object Array]'
    }
    register(event, callback, object){
        if(typeof event != 'string' || typeof callback != 'function') {
			return;
		}

		if(!this.listeners[event]) {
			this.listeners[event] = new Array();
		}
		this.listeners[event].push({object: (!this.isset(object) ? this.object : object), callback: callback});
    }
    unregister(event, callback, object){
        if(typeof event != 'string' || typeof callback != 'function') {
			return;
		}

		object = (!this.isset(object) ? this.object : object);

		if(this.listeners[event]) {
			for(let i = 0; i < this.listeners[event].length; i++) {
				if(this.listeners[event][i].object == object && this.listeners[event][i].callback == callback) {
					this.listeners[event].splice(i, 1);
					break;
				}
			}
		}
    }
    trigger(event, eventArguments, object){
        if(typeof event != 'string') {
			return false;
		}
		eventArguments = eventArguments || new Array();
		if(!this.isset(eventArguments)) {
			eventArguments = new Array();
		} else if(!this.isArray(eventArguments)) {
			eventArguments = [eventArguments];
		}

		if(event.substring(0, 5).toLowerCase() == 'mouse') {
			eventArguments[0] = this.normalizeEvent(eventArguments[0]);
		}

		if(!this.listeners[event] || this.listeners[event].length == 0) {
			return true;
		}

		let listeners = this.listeners[event].slice(0);

		for(let i = 0; i < listeners.length; i++) {
			let continueEvent = null;
			if(this.isset(object)) {
				continueEvent = listeners[i].callback.apply(object, eventArguments);
			} else {
				continueEvent = listeners[i].callback.apply(listeners[i].object, eventArguments);
			}

			if(continueEvent === false) {
				return false;
			}
		}
		return true;
    }
    normalizeEvent(event){
        return event;
    }
}
