/// <reference path="../../core/MeCalculator.ts"/>
/// <reference path="../../core/JsCommand.ts"/>
/// <reference path="../../core/DispatchedCommand.ts"/>
///! <reference path="../scalars/MeFloat.ts"/>

namespace org.eldanb.mecalc.calclib.filesys {
    var dirCommands = 
    {
        rcl : new core.JsCommand(function(cmd, stk) 
        { 
            var lSym = stk.popWithType(Symbol); 
            var lVal = core.calculator.currentDir.recall(lSym);
            return lVal.then((so) => {
                if(!so)
                {
                    throw new core.MeException("Symbol not found.");
                } 
        
                stk.push(so.dup());    
            });
        }, [Symbol], "Recall a variable's value in the current directory to the stack.", "files"),
       
        sto : new core.JsCommand(function(cmd, stk) 
        { 
            var lSym = stk.popWithType<Symbol>(Symbol);
            var lObj = stk.pop();
            var lDir = core.calculator.currentDir; 
            return lDir.store(lSym, lObj);            
        }, ["*", Symbol], "Store an object to a variable in the current directory.", "files"),
    
        purge : new core.JsCommand(function(cmd, stk) 
        { 
            var lSym = stk.popWithType<Symbol>(Symbol);
            var lDir = core.calculator.currentDir;
            return lDir.purge(lSym);            
        }, [Symbol], "Delete a variable from the current directory.", "files"),
    
        updir : new core.JsCommand(function(cmd, stk) 
        { 
            if(core.calculator.currentDir.parent)
            {
                core.calculator.changeDir(core.calculator.currentDir.parent);
            } else
            {
                throw new core.MeException("Cannot UPDIR from HOME.");
            }
        }, [], "Change the current directory to the parent of the current directory.", "files"),
    
        crdir : new core.JsCommand(function(cmd, stk) 
        { 
            var lSym = stk.popWithType<Symbol>(Symbol);
            var lCurDir = core.calculator.currentDir;
            var lNewDir = new Directory(lSym.name, lCurDir, core.calculator.storageProvider);
            return lCurDir.store(lSym, lNewDir);            
        }, [Symbol], "Create a new directory under the current directory named after the current symbol.", "files"),
    
        home : new core.JsCommand(function(cmd, stk) 
        { 
            core.calculator.changeDir(core.calculator.homeDir);
        }, [], "Set the current directory to HOME.", "files")
    }

    core.calculator.registerBuiltins(dirCommands);
}