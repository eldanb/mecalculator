namespace org.eldanb.mecalc.core {

    export class SerializedJson {
        public data : any;
    }

    export interface SerializationFormat {
        toJson(o : object) : object;
        fromJson(o : object) : object;
    }

    export class AutomaticSerializationFormat<T extends object> implements SerializationFormat {
        private _ctorArgs : Array<string>;
        private _ctor : new(...args : Array<any>) => T;

        constructor(ctor: new(...args :  Array<any>) => T, ...ctorArgsToAttrs : Array<string>) {
            this._ctor = ctor;
            this._ctorArgs = ctorArgsToAttrs;
        }

        private valueToJson(v : any) : any {
            if(typeof(v) == "object" && ObjectSerialization.getFormatter(v.constructor.name)) {
                return ObjectSerialization.toJson(v);
            } else 
            if(typeof(v) == "object" && v instanceof Array) {
                return v.map((i) => this.valueToJson(i));
            } else 
            {
                return v;
            }
        }

        private valueFromJson(v : any) : any {
            if(typeof(v) == "object" && v["$type"]) {
                return ObjectSerialization.fromJson(v);
            } else 
            if(typeof(v) == "object" && v instanceof Array) {
                return v.map((i) => this.valueFromJson(i));
            } else 
            {
                return v;
            }
        }

        toJson(o: object): object {
            let ret = {};
            this._ctorArgs.forEach((argName) => {
                ret[argName] = this.valueToJson(o[argName]);
            });

            return ret;
        }

        fromJson(o: object): T {
            let args = this._ctorArgs.map((argname) => this.valueFromJson(o[argname]));
            return new this._ctor(...args);
        }
    }

    export interface SerializableObjectCtor {
        new (...m:Array<any>) : object;

        name: string;
        format: SerializationFormat;
    }

    interface SerializableObjectClassMap {
        [klass : string] : SerializationFormat;
    }

    var serializableObjectClassMap : SerializableObjectClassMap = {};


    export class ObjectSerialization {

        static fromJson<T extends object>(jsonVal : object) : T {
            let klassType : string = jsonVal["$type"];
            return (this.getFormatter(klassType).fromJson(jsonVal) as T);
        }

        static toJson(obj : object) : object {
            let klassType : string = obj.constructor.name;
            let serJson = this.getFormatter(klassType).toJson(obj);
            serJson["$type"] = klassType;
            return serJson;
        }

        static registerSerializableClass(klass : SerializableObjectCtor) : void {
            serializableObjectClassMap[klass.name] = klass.format;
        }

        static getFormatter(name : string) : SerializationFormat {
            return serializableObjectClassMap[name];
        }

    }
}