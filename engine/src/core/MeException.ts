namespace org.eldanb.mecalc.core {

    export class MeException {

        _message : string;

        constructor(message : string) {
            this._message = message;
        }

        toString() : string {
            return this._message;
        }
    }
}