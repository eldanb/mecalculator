/// <reference path="../core/MeCalculator.ts"/>
/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>
/// <reference path="scalars/MeFloat.ts"/>

namespace org.eldanb.mecalc.calclib.core_commands {
    /////////////////////////////////////////////////////////////////////////
    /// Stack operations 
    /////////////////////////////////////////////////////////////////////////

    var FnCommands = {
    };


    var MeCoreJsCommands = {
        drop : new core.JsCommand(function(cmd, stk) 
        { 
            stk.pop(); 
        }, ["*"], "Drop the front of the stack.", "stack"),
    
        drop2 : new core.JsCommand(function(cmd, stk) 
        { 
            stk.popMultiple(2); 
        }, ["*", "*"], "Drop two elements from the stack.", "stack"),

        dropch : new core.JsCommand(function(cmd, stk) 
        { 
            stk.dropAt((stk.pop() as scalars.MeFloat).value);
        }, [scalars.MeFloat], "Drop an element from the stack, with slot identified by x.", "stack"),
    
        swap : new core.JsCommand(function(cmd, stk) 
        {         
            var v1 = stk.pop(); 
            var v2 = stk.pop(); 
            stk.push(v1); 
            stk.push(v2); 
        }, ["*", "*"], "Swap x and y.", "stack"),

        clear : new core.JsCommand(function(cmd, stk) 
        { 
            stk.clear(); 
        }, [], "Clear the stack.", "stack"),

        count : new core.JsCommand(function(cmd, stk) 
        { 
            stk.push(new scalars.MeFloat(stk.size()));
        }, [], "Count number of items in the stack.", "stack"),

        dup : new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.item(1);
            stk.push(v1.dup());
        }, ["*"], "Duplicate the bottom object on the stack.", "stack"),

        over : new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.item(2);
            stk.push(v1.dup());
        }, ["*", "*"], "Push a copy of stack slot 'y' onto the stack.", "stack"),

        dup2 : new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.item(2);
            stk.push(v1.dup());
            v1 = stk.item(2);
            stk.push(v1.dup());
        }, ["*","*"], "Push a copy of stack slot 'y' onto the stack.", "stack"),

        choose : new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.pop();
            v1 = stk.item((v1 as scalars.MeFloat).value);
            stk.push(v1.dup());
        }, [scalars.MeFloat], "Pop slot number; push a copy of the object in that slot onto the stack.", "stack"),

        rot : new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.popMultiple(3);
            stk.pushMultiple([v1[1], v1[2], v1[0]]);
        }, ["*", "*", "*"], "Rotate bottom three stack slots.", "stack"),

        unrot : new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.popMultiple(3);
            stk.pushMultiple([v1[2], v1[0], v1[1]]);
        }, ["*", "*", "*"], "Unrotate bottom three stack slots.", "stack"),

        exe : new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.pop(); 
            return v1.doExec(stk);
        }, ["*"], "Execute x.", "control"),

        wait : new core.JsCommand(function(cmd, stk) 
        { 
            var v1 = stk.popWithType(scalars.MeFloat).value;
            return new Promise((accept, rejcet) => {
                setTimeout(accept, v1*1000);
            });            
        }, [scalars.MeFloat], "Pop number of seconds to wait; waits that number of seconds.", "control"),

    };

    core.calculator.registerBuiltins(MeCoreJsCommands);



}