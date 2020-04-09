/// <reference path="StackObject.ts"/>
/// <reference path="MeException.ts"/>
/// <reference path="AutoRetireCalculatorStack.ts"/>

namespace org.eldanb.mecalc.core {
    export interface StackListener {
        stackUpdateSplice(aSender: CalculatorStack, aStart: number, aLen : number, aNewVals : Array<StackObject> | null);
    }

    export abstract class StackPreconditionTest {
        abstract evaluate(aObj : StackObject) : boolean;
    }

    export type StackPrecondition = string | StackObjectCtor | StackPreconditionTest;
    
    export interface ICalculatorStack {
        item(aIdx : number) : StackObject;
        size(): number;

        addListener(aListener: StackListener) : void;
        removeListener(aListener : StackListener) : void;
        
        push(aObj : StackObject) : void;
        pushMultiple(aPushWho : Array<StackObject>) : void;

        pop() : StackObject;
        popWithType<T>(tp : {new (...a: Array<any>) : T}) : T;

        popMultiple(aCount : number) : Array<StackObject>;
        dropAt(aAt : number) : StackObject;

        clear() : void;
                
        checkValidity(aPrecondition : Array<StackPrecondition>) : boolean;
        assertArgTypes(aPrecondition : Array<StackPrecondition>) : void;                
    };
}
