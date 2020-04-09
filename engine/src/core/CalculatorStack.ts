/// <reference path="StackObject.ts"/>
/// <reference path="MeException.ts"/>
/// <reference path="AutoRetireCalculatorStack.ts"/>
/// <reference path="ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.core {    
    export class CalculatorStack implements ICalculatorStack {
        _values : Array<StackObject>;
        _listeners : Array<StackListener>;

        constructor() {
            this._values = [];
            this._listeners = [];
        }    

        item(aIdx : number) : StackObject{
            return this._values[this._values.length-aIdx];
        }

        size(): number {        
            return this._values.length;
        }

        addListener(aListener: StackListener) : void {
            this._listeners.push(aListener);
        }
        
        removeListener(aListener : StackListener) : void {
            let listenerIdx = this._listeners.indexOf(aListener);
            if(listenerIdx != -1) {
                this._listeners.splice(listenerIdx, 1);
            }
        }
        
        push(aObj : StackObject) : void {
            this._values.push(aObj);
            this._notifySpliceChange(1, 0, [aObj]);
        }

        pushMultiple(aPushWho : Array<StackObject>) : void {
            this._values.push.apply(this._values, aPushWho);
            this._notifySpliceChange(1, 0, aPushWho);
        }

        pop() : StackObject {            
            let ret = this._values.pop();
            this._notifySpliceChange(1, 1, null);
            return ret;
        }
        
        popWithType<T>(tp : {new (...a: Array<any>) : T}) : T {
            let ret = this.pop();
            if(ret instanceof tp) {
                return (ret as T); 
            } else {
                throw new MeException("Expected type " + tp.name);
            }
        }
        
        popMultiple(aCount : number) : Array<StackObject> {            
            let ret = this._values.splice(this._values.length-aCount, aCount);
            this._notifySpliceChange(1, aCount, null);
            return ret;
        }

        dropAt(aAt : number) : StackObject {
            let ret = this._values.splice(this._values.length-aAt, 1)[0];
            this._notifySpliceChange(aAt, 1, null);
            return ret;
        }

        clear() : void {        
            let numVals = this.size();
            this._values = []; 
            this._notifySpliceChange(1, numVals, null);
        }
        
        private _notifySpliceChange(aStart : number, aLen : number, aNewVals: Array<StackObject> | null) : void {
            var listenerIdx;
            for(listenerIdx in this._listeners)
            {
                this._listeners[listenerIdx].stackUpdateSplice(this, aStart, aLen, aNewVals);
            }
        }
        

        public static preconditionComponentToString(aComponent : StackPrecondition) : string {
            if(typeof(aComponent)=='string')
            {
                return aComponent;
            } else
            if(aComponent instanceof StackPreconditionTest) {
                return aComponent.toString();
            } else 
            {
                return aComponent.readableName;
            }
        }

        private _preconditionArrayToString(aPreCond : Array<StackPrecondition>) : string {
            let precondContent = aPreCond.map((p) => CalculatorStack.preconditionComponentToString(p)).join(" ");
            return `[ ${precondContent} ]`;
        }

        public static checkPreconditionComponent(aPrecond : StackPrecondition, aArg : StackObject) : boolean {
	        return aPrecond == '*' ||
                   ((aPrecond instanceof Function) && 
                    (aArg instanceof aPrecond)) ||
                   ((aPrecond instanceof StackPreconditionTest) && 
                    (aPrecond.evaluate(aArg)))   
        }

        checkValidity(aPrecondition : Array<StackPrecondition>) : boolean
        {
            if(this.size() < aPrecondition.length)
            {
                return false;
            }

            for(var lArgIdx = 1; lArgIdx<=aPrecondition.length; lArgIdx++)
            {
                var lStackArg = this.item(lArgIdx);
                var lPreCond = aPrecondition[aPrecondition.length-lArgIdx];     
        
                if(!CalculatorStack.checkPreconditionComponent(lPreCond, lStackArg))
                {
                    return false;
                }                
            }
            return true;
        }

        assertArgTypes(aPrecondition : Array<StackPrecondition>) : void
        {
            if(!this.checkValidity(aPrecondition))
            {            
                throw new MeException("Invalid arguments; expected " + this._preconditionArrayToString(aPrecondition));
            }
        }
    };
}
