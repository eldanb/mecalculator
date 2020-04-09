/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>
/// <reference path="scalars/MeFloat.ts"/>
/// <reference path="CoreCommands.ts"/>

namespace org.eldanb.mecalc.calclib.boolean_commands {
    var MeBoolCommands = {
        land : new core.JsCommand(
            function(cmd : core.JsCommand, stk : core.CalculatorStack) : void {     
                var v1 = stk.popWithType(scalars.MeFloat).value; 
                var v2 = stk.popWithType(scalars.MeFloat).value; 
                stk.push(new scalars.MeFloat((v1!==0 && v2!==0)?1:0));
            }, [scalars.MeFloat, scalars.MeFloat], "Return 1 if x<>0 and y<>0; return 0 otherwise."),

        lor : new core.JsCommand(
            function(cmd : core.JsCommand, stk : core.CalculatorStack) : void {     
                var v1 = stk.popWithType(scalars.MeFloat).value; 
                var v2 = stk.popWithType(scalars.MeFloat).value; 
                stk.push(new scalars.MeFloat((v1!==0 || v2!==0)?1:0));
            }, [scalars.MeFloat, scalars.MeFloat], "Return 1 if x<>0 or y<>0; return 0 otherwise."),
        
        lnot : new core.JsCommand(
            function(cmd : core.JsCommand, stk : core.CalculatorStack) : void {     
                var v1 = stk.popWithType(scalars.MeFloat).value;
                stk.push(new scalars.MeFloat((v1!==0)?0:1));
            }, [scalars.MeFloat], "Return 1 if x=0; return 0 otherwise.")
    };

    core.calculator.registerBuiltins(MeBoolCommands);
}
