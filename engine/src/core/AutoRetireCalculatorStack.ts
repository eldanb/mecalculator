/// <reference path="ICalculatorStack.ts"/>
namespace org.eldanb.mecalc.core {
    export class AutoRetireCalculatorStack implements ICalculatorStack {
        private _delegate : ICalculatorStack;
        private _retiredObjects : Array<StackObject>;

        constructor(aStk : ICalculatorStack) {
            this._delegate = aStk;
            this._retiredObjects = [];
        }

        pop() : StackObject {
            let ret = this._delegate.pop();
            this._retiredObjects.push(ret);
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
        
        dropAt(aIdx : number) : StackObject
        {
            let ret = this._delegate.dropAt(aIdx);
            this._retiredObjects.push(ret);
            return ret;
        }


        popNoRetire() : void {
            this._delegate.pop();
        }

        popMultiple(aCount : number) : Array<StackObject> {
            let ret = this._delegate.popMultiple(aCount);
            this._retiredObjects.push.apply(this._retiredObjects, ret);    

            return ret;    
        }

        clear() : void {
            this.popMultiple(this.size());
        }

        retireObjects() : void {
            this._retiredObjects.forEach((o) => o.retire());
            this._retiredObjects = [];
        }

        item(aIdx: number): StackObject {
            return this._delegate.item(aIdx);
        }

        size(): number {
            return this._delegate.size();
        }

        addListener(aListener: StackListener): void {
            this._delegate.addListener(aListener);            
        }

        removeListener(aListener: StackListener): void {
            this._delegate.removeListener(aListener);
        }

        push(aObj: StackObject): void {
            this._delegate.push(aObj);
        }

        pushMultiple(aPushWho: StackObject[]): void {
            this._delegate.pushMultiple(aPushWho);
        }

        checkValidity(aPrecondition: StackPrecondition[]): boolean {
            return this._delegate.checkValidity(aPrecondition);
        }

        assertArgTypes(aPrecondition: StackPrecondition[]): void {
            this._delegate.assertArgTypes(aPrecondition);
        }
    }
}