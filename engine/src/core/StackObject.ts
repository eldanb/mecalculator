/// <reference path="SerializableObject.ts"/>
namespace org.eldanb.mecalc.core {

    export interface StackObjectCtor  {
        readableName : string;
        new (...m:Array<any>) : StackObject;
    }
        

    export class StackObject  {

        static registerStackObjectClass(klass : StackObjectCtor) {            
        }

        static registerSerializableStackObjectClass(klass : StackObjectCtor & SerializableObjectCtor) {
            this.registerStackObjectClass(klass);
            ObjectSerialization.registerSerializableClass(klass);
        }
       
        unparse() : string {
            return this.stackDisplayString();
        }

        
        doExec(aStk : ICalculatorStack) : Promise<void> {
            aStk.push(this.dup());
            return Promise.resolve();
        }

        stackDisplayString() : string {
            return "<obj>";
        }

        // Every stack object, when finishing its life, must have its retire() method called.
        retire(): void {

        }

        // Construct a duplicate of this object; retire() must be called on both instances.
        dup() : StackObject {
            return this;
        }
    }
/*
    export class SerializableStackObject extends StackObject implements SerializableObject {

        constructor(jsonObject : SerializedJson) {      
            super();      
            this.loadFromJson(jsonObject)
        }

        protected shouldStoreAttributeInArchive(attrName : string) : boolean {
            var lPropType = typeof(this[attrName]);
            const forbiddenAttributes = {
                "_typeId" : true,
                "_converters" : true,
                "_refCount" : true
            };

            return lPropType!='function' && !forbiddenAttributes[attrName];
        }

        toJson() : any {
            var ret = {};

            Object.keys(this).forEach((k) => {
                if(this.shouldStoreAttributeInArchive(k))
                    ret[k] = this[k];
            });
        }

        loadFromJson(aJson : SerializedJson) : void { 
            Object.assign(this, aJson.data);
        }
    }*/

    export abstract class RefCountedStackObject extends StackObject {
        _refCount : number = 1;

        dup() : StackObject { 
            this._refCount++; 
            return this; 
        }

        protected get refCount() : number { 
            return this._refCount; 
        }

        retire() : void { 
            if(this._refCount-- == 1) {
                this.retiringLastRef();
            } 
        }

        abstract retiringLastRef() : void;
    }
}