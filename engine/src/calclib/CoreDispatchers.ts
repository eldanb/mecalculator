/// <reference path="../core/MeCalculator.ts"/>
/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>

namespace org.eldanb.mecalc.calclib.core_commands {

    //////////////////////////////////////////////////////////////////////////////////////////
    /// Dispatched basic operations
    //////////////////////////////////////////////////////////////////////////////////////////
    export var MePlusDispatch = new core.DispatchedCommand("Add two arguments.", "math arithmetic");
    export var MeMinusDispatch = new core.DispatchedCommand("Subtract two arguments.", "math arithmetic");
    export var MeTimesDispatch = new core.DispatchedCommand("Multiply two arguments.", "math arithmetic");
    export var MeDivideDispatch = new core.DispatchedCommand("Divide two arguments.", "math arithmetic");
    export var MeNegateDispatch = new core.DispatchedCommand("Change the sign of an argument.", "math arithmetic");
    export var MeInverseDispatch = new core.DispatchedCommand("Calculate the reciprocal of an argument.", "math arithmetic");
    export var MeExpDispatch = new core.DispatchedCommand("Calculate e (the natural base) to the power of an argument.", "math");
    export var MeSqrtDispatch = new core.DispatchedCommand("Calculate the square root an argument.", "math");
    export var MeAbsDispatch = new core.DispatchedCommand("Calculate the absolute value/norm of an argument.", "math");
    export var MeLnDispatch = new core.DispatchedCommand("Calculate the logarithm of an argument to the natural base.", "math");
    export var MeLogDispatch = new core.DispatchedCommand("Calculate the logarithm of an argument to the natural base.", "math");
    export var MePowDispatch = new core.DispatchedCommand("Raise y to the power of x.", "math");
    export var MeSqrDispatch = new core.DispatchedCommand("Raise x to the power of 2.", "math");
    export var MeSinDispatch = new core.DispatchedCommand("Calculate the sine of the argument.", "math");
    export var MeCosDispatch = new core.DispatchedCommand("Calculate the cosine of the argument.", "math");
    export var MeTanDispatch = new core.DispatchedCommand("Calculate the tangent of the argument.", "math");
    export var MeArcSinDispatch = new core.DispatchedCommand("Calculate the arc-sine of the argument.", "math");
    export var MeArcTanDispatch = new core.DispatchedCommand("Calculate the arc-tangent of the argument.", "math");
    export var MeArcCosDispatch = new core.DispatchedCommand("Calculate the arc-cosine of the argument.", "math");
    export var MeFloorDispatch = new core.DispatchedCommand("Return the largest integer smaller than or equal to the argument.", "math");
    export var MeCeilDispatch = new core.DispatchedCommand("Return the smallest integer larger than or equal to the argument.", "math");
    export var MeRandDispatch = new core.DispatchedCommand("Return a pseudo random number between 0 and 1.", "math");

    export var MeGreaterThanDispatch = new core.DispatchedCommand("Return 1 if x>y, 0 otherwise.", "relational");
    export var MeLessThanDispatch = new core.DispatchedCommand("Return 1 if x<y, 0 otherwise.", "relational");
    export var MeGreaterThanEqualsDispatch = new core.DispatchedCommand("Return 1 if x>=y, 0 otherwise.", "relational");
    export var MeLessThanEqualsDispatch = new core.DispatchedCommand("Return 1 if x<=y, 0 otherwise.", "relational");
    export var MeEqualsDispatch = new core.DispatchedCommand("Return 1 if x=y, 0 otherwise.", "relational");
    export var MeNotEqualsDispatch = new core.DispatchedCommand("Return 1 if x<>y, 0 otherwise.", "relational");

    export var MeConjDispatch = new core.DispatchedCommand("Return conjugate of operand.", "math");
    
    export interface DispatcherCategory { 
        [name : string] : core.DispatchedCommand;
    }

    export var MeCoreElementaryFunctions : DispatcherCategory = {

        "negate" : MeNegateDispatch,
        "inv" : MeInverseDispatch,
        "conj" : MeConjDispatch,

        "exp"    : MeExpDispatch,
        "sqrt"   : MeSqrtDispatch,
        "abs"    : MeAbsDispatch, 
        "ln"     : MeLnDispatch,
        "sqr"    : MeSqrDispatch,

        "sin"    : MeSinDispatch,
        "cos"    : MeCosDispatch,
        "tan"    : MeTanDispatch,
        "asin"   : MeArcSinDispatch,
        "atan"   : MeArcTanDispatch,
        "acos"   : MeArcCosDispatch,         
        "floor"  : MeFloorDispatch,        
        "ceil"   : MeCeilDispatch,
        "rand"   : MeRandDispatch,    
    }

    var MeCoreDispatchedCommands : DispatcherCategory = 
    {
        "plus" : MePlusDispatch,
        "+" : MePlusDispatch,
        "minus" : MeMinusDispatch,
        "-" : MeMinusDispatch,
        "times" : MeTimesDispatch,
        "*" : MeTimesDispatch,
        "divide" : MeDivideDispatch,
        "/" : MeDivideDispatch,

        "gt"     : MeGreaterThanDispatch,
        ">"      : MeGreaterThanDispatch,
        "gte"    : MeGreaterThanEqualsDispatch,
        ">="     : MeGreaterThanEqualsDispatch,
        "lt"     : MeLessThanDispatch,
        "<"      : MeLessThanDispatch,
        "lte"    : MeLessThanEqualsDispatch,
        "<="     : MeLessThanEqualsDispatch,
        "eq"     : MeEqualsDispatch,
        "="      : MeEqualsDispatch,
        "neq"    : MeNotEqualsDispatch,
        "<>"     : MeNotEqualsDispatch,

    };
    
    core.calculator.registerBuiltins(MeCoreDispatchedCommands);    
    core.calculator.registerBuiltins(MeCoreElementaryFunctions);    

    core.calculator.registerBuiltins({"pow"    : MePowDispatch});    
}