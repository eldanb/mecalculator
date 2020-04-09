namespace org.eldanb.mecalc.calclib {
    // Unfortunately this can't be easily made abstract 
    export class StackObjectSequence extends core.RefCountedStackObject {
        
        static readableName : string = "StackObjectSequence";

        put(idx : number, value : core.StackObject) : void {
            throw new core.MeException("Invalid PUT operation");
        }

        get(idx : number) : core.StackObject {
            throw new core.MeException("Invalid GET operation");
        }

        mid(start : number, end : number) : StackObjectSequence {
            throw new core.MeException("Invalid MID operation");
        }

        find(who : core.StackObject) : scalars.MeFloat {
            throw new core.MeException("Invalid FIND operation");
        }

        rfind(who : core.StackObject) : scalars.MeFloat {
            throw new core.MeException("Invalid RFIND operation");
        }

        size() : number {
            return 0;
        }

        swapForWritable() : StackObjectSequence
        {
            return null;
        }

        retiringLastRef(): void {
            
        }

        constructor() {
            super();
        }
    }

    var sequenceCommands = {
        "get": new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.popWithType(scalars.MeFloat);
            var v2 = stk.popWithType(StackObjectSequence);
            stk.push(v2.get(v1.value));
        }, [StackObjectSequence, scalars.MeFloat], "Get element from sequence.", "sequence"),

        "put": new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.pop();
            var v2 = stk.popWithType(scalars.MeFloat);
            var v3 = stk.popWithType(StackObjectSequence);

            v3 = v3.swapForWritable();
            v3.put(v2.value, v1);
            stk.push(v3);
        }, [StackObjectSequence, scalars.MeFloat, "*"], "Put element in sequence.", "sequence"),

        "size": new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.popWithType(StackObjectSequence);
            stk.push(new scalars.MeFloat(v1.size()));
        }, [StackObjectSequence], "Get size of sequence.", "sequence"),   
        
        "mid": new core.JsCommand(function(cmd, stk) 
        { 
            var end = stk.popWithType(scalars.MeFloat);
            var start = stk.popWithType(scalars.MeFloat);
            var seq = stk.popWithType(StackObjectSequence);
            stk.push(seq.mid(start.value, end.value));
        }, [StackObjectSequence, scalars.MeFloat, scalars.MeFloat], "Return subsequence of z, from index y to index x, exclusive.", "sequence"),   
        
        "find": new core.JsCommand(function(cmd, stk) 
        { 
            var substr = stk.pop();            
            var seq = stk.popWithType(StackObjectSequence);
            stk.push(seq.find(substr));
        }, [StackObjectSequence, "*"], "Return index of first occurence of x within y, -1 if not found.", "sequence"),   
        
        "rfind": new core.JsCommand(function(cmd, stk) 
        { 
            var substr = stk.pop();            
            var seq = stk.popWithType(StackObjectSequence);
            stk.push(seq.rfind(substr));
        }, [StackObjectSequence, "*"], "Return index of last occurence of x within y, -1 if not found.", "sequence"),   
    };

    core.calculator.registerBuiltins(sequenceCommands);
}