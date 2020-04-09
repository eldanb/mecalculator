/// <reference path="StackObject.ts"/>
namespace org.eldanb.mecalc.core {

    export type JsCommandFunction = ((cmd: JsCommand, stack: ICalculatorStack) => void) | ((cmd: JsCommand, stack: ICalculatorStack) => Promise<void>);

    export class JsCommand extends StackObject {
        static readableName : string = "JsCommand";
        
        _precondition: Array<StackPrecondition>;
        _fn: JsCommandFunction;
        _docString : string;
        _tags : string;

        constructor(aFn? : JsCommandFunction, aPrecondition? : Array<StackPrecondition>, aDocString? : string, aTags? : string)
        { 
            super();

            this._fn = aFn;
            this._precondition = aPrecondition;
            this._docString = aDocString;
            this._tags = aTags;                        
        }
        
        stackDisplayString() : string {
            return "<Javascript Command>";
        }
        
        doExec(aStk : ICalculatorStack) : Promise<void>
        {
            return new Promise((accept, reject) => {
                if(this._precondition) {
                    aStk.assertArgTypes(this._precondition)
                }

                var lAutoRetireStack = new AutoRetireCalculatorStack(aStk);
                let lCompletionPromise = this._fn(this, lAutoRetireStack) || Promise.resolve();

                lCompletionPromise.then(() => {
                    lAutoRetireStack.retireObjects();  
                
                    accept();    
                }).catch(reject);
            });
        }
        
        
        getDocXml(aParentElement) {
            var lRet = aParentElement.ownerDocument.createElement('simple-command');        
            if(this._tags)
            {
                lRet.setAttribute('tags', this._tags);
            }
            aParentElement.appendChild(lRet);
        
            var lPrecondElem = aParentElement.ownerDocument.createElement('precondition');
            lRet.appendChild(lPrecondElem);
        
            this._precondition.forEach((p) => {
                var lStackItemElem = aParentElement.ownerDocument.createElement('stack-item');
                lStackItemElem.setAttribute('stack-item-type', CalculatorStack.preconditionComponentToString(p));
                lPrecondElem.appendChild(lStackItemElem);
            });
        
            if(this._docString)
            {
                var lDocElem = aParentElement.ownerDocument.createElement('documentation');
                lDocElem.appendChild(aParentElement.ownerDocument.createTextNode(this._docString));
                lRet.appendChild(lDocElem);
            }
            
            return lRet;
        }        
    }

    StackObject.registerStackObjectClass(JsCommand);
}