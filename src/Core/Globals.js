let _GlobalsId = 0;
export default class Globals {
    constructor() {

    }
    static nextId(){
        return _GlobalsId--;
    }

}