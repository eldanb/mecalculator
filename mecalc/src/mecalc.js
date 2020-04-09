var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                var serializableObjectClassMap = {};
                class SerializableObject {
                    static registerSerializableClass(klass) {
                        serializableObjectClassMap[klass.name] = klass;
                    }
                    static getClass(name) {
                        return serializableObjectClassMap[name];
                    }
                }
                core.SerializableObject = SerializableObject;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="SerializableObject.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class StackObject extends core.SerializableObject {
                    constructor() {
                        super();
                    }
                    static registerStackObjectClass(klass) {
                        core.SerializableObject.registerSerializableClass(klass);
                    }
                    unparse() {
                        return this.stackDisplayString();
                    }
                    archiveStore(aArchive) {
                        for (var aProp in this) {
                            var lPropType = typeof (this[aProp]);
                            if (lPropType != 'function' && aProp.substr(0, 1) != '_')
                                aArchive.writeProperty(aProp, this[aProp]);
                        }
                    }
                    archiveLoad(aArchive) {
                        while (aArchive.containerHasMoreData()) {
                            var lPropNameAndVal = aArchive.readProperty();
                            this[lPropNameAndVal.name] = lPropNameAndVal.value;
                        }
                    }
                    doExec(aStk) {
                        aStk.push(this.dup());
                    }
                    stackDisplayString() {
                        return "<obj>";
                    }
                    // Every stack object, when finishing its life, must have its retire() method called.
                    retire() {
                    }
                    // Construct a duplicate of this object; retire() must be called on both instances.
                    dup() {
                        return this;
                    }
                }
                core.StackObject = StackObject;
                class RefCountedStackObject extends StackObject {
                    constructor() {
                        super(...arguments);
                        this._refCount = 1;
                    }
                    dup() {
                        this._refCount++;
                        return this;
                    }
                    get refCount() {
                        return this._refCount;
                    }
                    retire() {
                        if (this._refCount-- == 1) {
                            this.retiringLastRef();
                        }
                    }
                }
                core.RefCountedStackObject = RefCountedStackObject;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="StackObject.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class JsCommand extends core.StackObject {
                    constructor(aFn, aPrecondition, aDocString, aTags) {
                        super();
                        this._fn = aFn;
                        this._precondition = aPrecondition;
                        this._docString = aDocString;
                        this._tags = aTags;
                    }
                    stackDisplayString() {
                        return "<Javascript Command>";
                    }
                    doExec(aStk) {
                        if (this._precondition) {
                            aStk.assertArgTypes(this._precondition);
                        }
                        var lAutoRetireStack = new core.AutoRetireCalculatorStack(aStk);
                        this._fn(this, lAutoRetireStack);
                        lAutoRetireStack.retireObjects();
                    }
                    getDocXml(aParentElement) {
                        var lRet = aParentElement.ownerDocument.createElement('simple-command');
                        if (this._tags) {
                            lRet.setAttribute('tags', this._tags);
                        }
                        aParentElement.appendChild(lRet);
                        var lPrecondElem = aParentElement.ownerDocument.createElement('precondition');
                        lRet.appendChild(lPrecondElem);
                        this._precondition.forEach((p) => {
                            var lStackItemElem = aParentElement.ownerDocument.createElement('stack-item');
                            lStackItemElem.setAttribute('stack-item-type', core.CalculatorStack.preconditionComponentToString(p));
                            lPrecondElem.appendChild(lStackItemElem);
                        });
                        if (this._docString) {
                            var lDocElem = aParentElement.ownerDocument.createElement('documentation');
                            lDocElem.appendChild(aParentElement.ownerDocument.createTextNode(this._docString));
                            lRet.appendChild(lDocElem);
                        }
                        return lRet;
                    }
                }
                core.JsCommand = JsCommand;
                core.StackObject.registerStackObjectClass(JsCommand);
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="StackObject.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class DispatchedCommand extends core.StackObject {
                    constructor(aDocString, aTags) {
                        super();
                        this._dispatchOptions = [];
                        this._tags = aTags;
                        this._docString = aDocString;
                    }
                    stackDisplayString() {
                        return "<Dispatched Command>";
                    }
                    doExec(aStk) {
                        let lDispOpt = this._dispatchOptions.find((o) => aStk.checkValidity(o.precondition));
                        if (lDispOpt) {
                            var lAutoRetire = new core.AutoRetireCalculatorStack(aStk);
                            lDispOpt.fn(this, lDispOpt, lAutoRetire);
                            lAutoRetire.retireObjects();
                        }
                        else {
                            throw new core.MeException("Invalid arguments.");
                        }
                    }
                    directApply(...args) {
                        let lDispOpt = this._dispatchOptions.find((dispOpt) => {
                            if (!dispOpt.directFn) {
                                return false;
                            }
                            if (args.length != dispOpt.precondition.length) {
                                return false;
                            }
                            for (var lCompIdx = 0; lCompIdx < dispOpt.precondition.length; lCompIdx++) {
                                if (!core.CalculatorStack.checkPreconditionComponent(dispOpt.precondition[lCompIdx], arguments[lCompIdx])) {
                                    return false;
                                }
                            }
                            return true;
                        });
                        if (lDispOpt) {
                            return lDispOpt.directFn.apply(null, args);
                        }
                        else {
                            throw new core.MeException("Invalid arguments.");
                        }
                    }
                    registerDispatchOptionInternal(aPrecondition, aFnOrConversion, aStackFn) {
                        var lOpt;
                        if (aFnOrConversion instanceof Function) {
                            if (aStackFn) {
                                lOpt = {
                                    precondition: aPrecondition,
                                    fn: aFnOrConversion,
                                    directFn: null
                                };
                            }
                            else {
                                lOpt = {
                                    precondition: aPrecondition,
                                    directFn: aFnOrConversion,
                                    fn: (aCmd, aOpt, aStk) => {
                                        var lArgs = aStk.popMultiple(aFnOrConversion.length);
                                        aStk.push(aFnOrConversion.apply(null, lArgs));
                                    }
                                };
                            }
                        }
                        else {
                            var lConv = [];
                            for (var lIdx = 0; lIdx < aFnOrConversion.length; lIdx++) {
                                lConv.push(Conversions.getConverter(aPrecondition[lIdx], aFnOrConversion[lIdx]));
                            }
                            lOpt = {
                                precondition: aPrecondition,
                                fn: (aCmd, aOpt, aStk) => {
                                    var lArgs = aStk.popMultiple(lConv.length);
                                    for (var lIdx = 0; lIdx < lArgs.length; lIdx++) {
                                        lArgs[lIdx] = lConv[lIdx](lArgs[lIdx]);
                                    }
                                    aStk.pushMultiple(lArgs);
                                    aCmd.doExec(aStk);
                                },
                                directFn: (...args) => {
                                    var lArgs = args.slice(0);
                                    for (var lIdx = 0; lIdx < lArgs.length; lIdx++) {
                                        lArgs[lIdx] = lConv[lIdx](lArgs[lIdx]);
                                    }
                                    this.directApply.apply(lArgs);
                                }
                            };
                        }
                        this._dispatchOptions.push(lOpt);
                    }
                    registerDispatchOption(aPrecondition, aFnOrConversion) {
                        this.registerDispatchOptionInternal(aPrecondition, aFnOrConversion, true);
                    }
                    registerDispatchOptionFn(aPrecondition, aFnOrConversion) {
                        this.registerDispatchOptionInternal(aPrecondition, aFnOrConversion, false);
                    }
                    getDocXml(aParentElement) {
                        var lRet = aParentElement.ownerDocument.createElement('dispatched-command');
                        if (this._tags) {
                            lRet.setAttribute('tags', this._tags);
                        }
                        aParentElement.appendChild(lRet);
                        this._dispatchOptions.forEach((lDispOpt) => {
                            var lDispOptElem = aParentElement.ownerDocument.createElement('dispatch-option');
                            lRet.appendChild(lDispOptElem);
                            var lDispOptPrecondElem = aParentElement.ownerDocument.createElement('precondition');
                            lDispOptElem.appendChild(lDispOptPrecondElem);
                            for (var lIdx in lDispOpt.precondition) {
                                var lStackItemElem = aParentElement.ownerDocument.createElement('stack-item');
                                lStackItemElem.setAttribute('stack-item-type', core.CalculatorStack.preconditionComponentToString(lDispOpt.precondition[lIdx]));
                                lDispOptPrecondElem.appendChild(lStackItemElem);
                            }
                        });
                        if (this._docString) {
                            var lDocElem = aParentElement.ownerDocument.createElement('documentation');
                            lDocElem.appendChild(aParentElement.ownerDocument.createTextNode(this._docString));
                            lRet.appendChild(lDocElem);
                        }
                        return lRet;
                    }
                }
                core.DispatchedCommand = DispatchedCommand;
                core.StackObject.registerStackObjectClass(DispatchedCommand);
                class Conversions {
                    static registerConversion(aSrc, aTarget, aFn) {
                        if (!aTarget.prototype._converters) {
                            aTarget.prototype._converters = {};
                        }
                        if (!aSrc.prototype._typeId) {
                            aSrc.prototype._typeId = Conversions.typeIdSeed;
                            Conversions.typeIdSeed++;
                        }
                        aTarget.prototype._converters[aSrc.prototype._typeId] = aFn;
                    }
                    static convert(aSrc, aType) {
                        try {
                            return aType.prototype._converters[aSrc.constructor.prototype._typeId](aSrc);
                        }
                        catch (e) {
                            throw new core.MeException("Cannot convert object. " + e);
                        }
                    }
                    static getConverter(aSrcType, aType) {
                        try {
                            if (aSrcType == aType) {
                                return function (x) { return x.dup(); };
                            }
                            else if (aSrcType instanceof Function) {
                                return aType.prototype._converters[aSrcType.prototype._typeId];
                            }
                            else {
                                throw new core.MeException("Invalid source type.");
                            }
                        }
                        catch (e) {
                            throw new core.MeException("Conversion not found.");
                        }
                    }
                }
                ///////////////////////////////////////////////////////////////////////////////////
                /// Conversion System            
                ///////////////////////////////////////////////////////////////////////////////////
                Conversions.typeIdSeed = 10000;
                core.Conversions = Conversions;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class ParserResult {
                    constructor(len, obj, isBuiltin, resolvedName) {
                        this._len = len;
                        this._parsedObject = obj;
                        this._isBuiltin = isBuiltin;
                        this._resolvedName = resolvedName;
                    }
                    get len() { return this._len; }
                    get obj() { return this._parsedObject; }
                    get isBuiltin() { return this._isBuiltin; }
                    get resolvedName() { return this._resolvedName; }
                }
                core.ParserResult = ParserResult;
                const nameRe = /^(([a-zA-Z]\S*)|[+\-*\/<>=]|(>=)|(<=)|(<>))(\s+.*)?$/;
                class Parser {
                    constructor(aOwner) {
                        this._owner = aOwner;
                        this._parserList = [];
                    }
                    registerParser(aParser) {
                        this._parserList.push(aParser);
                    }
                    parseStackObject(aStr) {
                        var lName;
                        var lParserIdx;
                        for (lParserIdx in this._parserList) {
                            let lRet = this._parserList[lParserIdx](aStr);
                            if (lRet)
                                return lRet;
                        }
                        return null;
                    }
                    parseObjectReference(aStr, aAllowUnboundNames) {
                        var lName;
                        var lResolvedObj;
                        var lIsBuiltin = false;
                        var lMatchRes = nameRe.exec(aStr);
                        if (!lMatchRes) {
                            return null;
                        }
                        lName = lMatchRes[1];
                        lResolvedObj = this._owner.currentDir.getByString(lName);
                        if (!lResolvedObj) {
                            lResolvedObj = this._owner.getBuiltin(lName);
                            lIsBuiltin = true;
                        }
                        if (lResolvedObj) {
                            return new ParserResult(lMatchRes[1].length, lResolvedObj, lIsBuiltin, lName);
                        }
                        else {
                            return aAllowUnboundNames ? new ParserResult(lMatchRes[1].length, null, false, lName) : null;
                        }
                    }
                }
                core.Parser = Parser;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class MeException {
                    constructor(message) {
                        this._message = message;
                    }
                    toString() {
                        return this._message;
                    }
                }
                core.MeException = MeException;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class AutoRetireCalculatorStack {
                    constructor(aStk) {
                        this._delegate = aStk;
                        this._retiredObjects = [];
                    }
                    pop() {
                        let ret = this._delegate.pop();
                        this._retiredObjects.push(ret);
                        return ret;
                    }
                    popWithType(tp) {
                        let ret = this.pop();
                        if (ret instanceof tp) {
                            return ret;
                        }
                        else {
                            throw new core.MeException("Expected type " + tp.name);
                        }
                    }
                    dropAt(aIdx) {
                        let ret = this._delegate.dropAt(aIdx);
                        this._retiredObjects.push(ret);
                        return ret;
                    }
                    popNoRetire() {
                        this._delegate.pop();
                    }
                    popMultiple(aCount) {
                        let ret = this._delegate.popMultiple(aCount);
                        this._retiredObjects.push.apply(this._retiredObjects, ret);
                        return ret;
                    }
                    clear() {
                        this.popMultiple(this.size());
                    }
                    retireObjects() {
                        this._retiredObjects.forEach((o) => o.retire());
                        this._retiredObjects = [];
                    }
                    item(aIdx) {
                        return this._delegate.item(aIdx);
                    }
                    size() {
                        return this._delegate.size();
                    }
                    addListener(aListener) {
                        this._delegate.addListener(aListener);
                    }
                    removeListener(aListener) {
                        this._delegate.removeListener(aListener);
                    }
                    push(aObj) {
                        this._delegate.push(aObj);
                    }
                    pushMultiple(aPushWho) {
                        this._delegate.pushMultiple(aPushWho);
                    }
                    checkValidity(aPrecondition) {
                        return this._delegate.checkValidity(aPrecondition);
                    }
                    assertArgTypes(aPrecondition) {
                        this._delegate.assertArgTypes(aPrecondition);
                    }
                }
                core.AutoRetireCalculatorStack = AutoRetireCalculatorStack;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="StackObject.ts"/>
/// <reference path="MeException.ts"/>
/// <reference path="AutoRetireCalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                ;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="StackObject.ts"/>
/// <reference path="MeException.ts"/>
/// <reference path="AutoRetireCalculatorStack.ts"/>
/// <reference path="ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class CalculatorStack {
                    constructor() {
                        this._values = [];
                        this._listeners = [];
                    }
                    item(aIdx) {
                        return this._values[this._values.length - aIdx];
                    }
                    size() {
                        return this._values.length;
                    }
                    addListener(aListener) {
                        this._listeners.push(aListener);
                    }
                    removeListener(aListener) {
                        let listenerIdx = this._listeners.indexOf(aListener);
                        if (listenerIdx != -1) {
                            this._listeners.splice(listenerIdx, 1);
                        }
                    }
                    push(aObj) {
                        this._values.push(aObj);
                        this._notifySpliceChange(1, 0, [aObj]);
                    }
                    pushMultiple(aPushWho) {
                        this._values.push.apply(this._values, aPushWho);
                        this._notifySpliceChange(1, 0, aPushWho);
                    }
                    pop() {
                        let ret = this._values.pop();
                        this._notifySpliceChange(1, 1, null);
                        return ret;
                    }
                    popWithType(tp) {
                        let ret = this.pop();
                        if (ret instanceof tp) {
                            return ret;
                        }
                        else {
                            throw new core.MeException("Expected type " + tp.name);
                        }
                    }
                    popMultiple(aCount) {
                        let ret = this._values.splice(this._values.length - aCount, aCount);
                        this._notifySpliceChange(1, aCount, null);
                        return ret;
                    }
                    dropAt(aAt) {
                        let ret = this._values.splice(this._values.length - aAt, 1)[0];
                        this._notifySpliceChange(aAt, 1, null);
                        return ret;
                    }
                    clear() {
                        let numVals = this.size();
                        this._values = [];
                        this._notifySpliceChange(1, numVals, null);
                    }
                    _notifySpliceChange(aStart, aLen, aNewVals) {
                        var listenerIdx;
                        for (listenerIdx in this._listeners) {
                            this._listeners[listenerIdx].stackUpdateSplice(this, aStart, aLen, aNewVals);
                        }
                    }
                    static preconditionComponentToString(aComponent) {
                        if (typeof (aComponent) == 'string') {
                            return aComponent;
                        }
                        else {
                            return aComponent.readableName;
                        }
                    }
                    _preconditionArrayToString(aPreCond) {
                        let precondContent = aPreCond.map((p) => CalculatorStack.preconditionComponentToString(p)).join(" ");
                        return `[ ${precondContent} ]`;
                    }
                    static checkPreconditionComponent(aPrecond, aArg) {
                        return aPrecond == '*' ||
                            ((aPrecond instanceof Function) &&
                                (aArg instanceof aPrecond));
                    }
                    checkValidity(aPrecondition) {
                        if (this.size() < aPrecondition.length) {
                            return false;
                        }
                        for (var lArgIdx = 1; lArgIdx <= aPrecondition.length; lArgIdx++) {
                            var lStackArg = this.item(lArgIdx);
                            var lPreCond = aPrecondition[aPrecondition.length - lArgIdx];
                            if (!CalculatorStack.checkPreconditionComponent(lPreCond, lStackArg)) {
                                return false;
                            }
                        }
                        return true;
                    }
                    assertArgTypes(aPrecondition) {
                        if (!this.checkValidity(aPrecondition)) {
                            throw new core.MeException("Invalid arguments; expected " + this._preconditionArrayToString(aPrecondition));
                        }
                    }
                }
                core.CalculatorStack = CalculatorStack;
                ;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="Parser.ts"/>
/// <reference path="CalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var filesys;
                (function (filesys) {
                })(filesys = calclib.filesys || (calclib.filesys = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class MeCalculator {
                    constructor() {
                        this._parser = new core.Parser(this);
                        this._stack = new core.CalculatorStack();
                        this._builtins = {};
                        this._homeDir = null;
                        this._curDir = this._homeDir;
                        this._execCtxt = [];
                        this._listeners = [];
                    }
                    get stack() {
                        return this._stack;
                    }
                    get parser() {
                        return this._parser;
                    }
                    get currentDir() {
                        return this._curDir;
                    }
                    get homeDir() {
                        return this._homeDir;
                    }
                    getProgExecContext() {
                        return this._execCtxt.length ? this._execCtxt[this._execCtxt.length - 1] : null;
                    }
                    pushExecContext(aCtxt) {
                        this._execCtxt.push(aCtxt);
                    }
                    popExecContext() {
                        return this._execCtxt.pop();
                    }
                    processCommandLine(aCmd) {
                        var lCmdOb;
                        while (true) {
                            aCmd = aCmd.replace(/^\s*/, "");
                            if (aCmd.length) {
                                let lParseRes = this.parser.parseStackObject(aCmd);
                                if (lParseRes) {
                                    this.stack.push(lParseRes.obj);
                                    aCmd = aCmd.substring(lParseRes.len, aCmd.length);
                                }
                                else {
                                    let lParseRef = this.parser.parseObjectReference(aCmd, false);
                                    if (lParseRef) {
                                        aCmd = aCmd.substring(lParseRef.len, aCmd.length);
                                        lParseRef.obj.doExec(this.stack);
                                    }
                                    else {
                                        throw new core.MeException("Command line parse error: " + aCmd);
                                    }
                                }
                            }
                            else {
                                break;
                            }
                        }
                    }
                    registerBuiltins(aBuiltins) {
                        this._builtins = Object.assign(this._builtins, aBuiltins);
                    }
                    getBuiltin(aName) {
                        return this._builtins[aName];
                    }
                    changeDir(aDir) {
                        this._curDir = aDir;
                        this._listeners.forEach((l) => l.notifyChangeDir(this, aDir));
                    }
                    loadHomeDirectory(aDir) {
                        this._homeDir = aDir;
                        this.changeDir(this._homeDir);
                    }
                    notifyFsChange(aOp, aDir, aId, aObj) {
                        this._listeners.forEach((l) => l.notifyFsChange(this, aOp, aDir, aId, aObj));
                    }
                    init(aHomeDir) {
                        this.loadHomeDirectory(aHomeDir);
                    }
                    ;
                    addListener(aListener) {
                        this._listeners.push(aListener);
                    }
                }
                core.MeCalculator = MeCalculator;
                core.calculator = new MeCalculator();
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../core/MeCalculator.ts"/>
/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var core_commands;
                (function (core_commands) {
                    //////////////////////////////////////////////////////////////////////////////////////////
                    /// Dispatched basic operations
                    //////////////////////////////////////////////////////////////////////////////////////////
                    core_commands.MePlusDispatch = new mecalc.core.DispatchedCommand("Add two arguments.", "math arithmetic");
                    core_commands.MeMinusDispatch = new mecalc.core.DispatchedCommand("Subtract two arguments.", "math arithmetic");
                    core_commands.MeTimesDispatch = new mecalc.core.DispatchedCommand("Multiply two arguments.", "math arithmetic");
                    core_commands.MeDivideDispatch = new mecalc.core.DispatchedCommand("Divide two arguments.", "math arithmetic");
                    core_commands.MeNegateDispatch = new mecalc.core.DispatchedCommand("Change the sign of an argument.", "math arithmetic");
                    core_commands.MeInverseDispatch = new mecalc.core.DispatchedCommand("Calculate the reciprocal of an argument.", "math arithmetic");
                    core_commands.MeExpDispatch = new mecalc.core.DispatchedCommand("Calculate e (the natural base) to the power of an argument.", "math");
                    core_commands.MeSqrtDispatch = new mecalc.core.DispatchedCommand("Calculate the square root an argument.", "math");
                    core_commands.MeAbsDispatch = new mecalc.core.DispatchedCommand("Calculate the absolute value/norm of an argument.", "math");
                    core_commands.MeLnDispatch = new mecalc.core.DispatchedCommand("Calculate the logarithm of an argument to the natural base.", "math");
                    core_commands.MePowDispatch = new mecalc.core.DispatchedCommand("Raise y to the power of x.", "math");
                    core_commands.MeSqrDispatch = new mecalc.core.DispatchedCommand("Raise x to the power of 2.", "math");
                    core_commands.MeGreaterThanDispatch = new mecalc.core.DispatchedCommand("Return 1 if x>y, 0 otherwise.", "relational");
                    core_commands.MeLessThanDispatch = new mecalc.core.DispatchedCommand("Return 1 if x<y, 0 otherwise.", "relational");
                    core_commands.MeGreaterThanEqualsDispatch = new mecalc.core.DispatchedCommand("Return 1 if x>=y, 0 otherwise.", "relational");
                    core_commands.MeLessThanEqualsDispatch = new mecalc.core.DispatchedCommand("Return 1 if x<=y, 0 otherwise.", "relational");
                    core_commands.MeEqualsDispatch = new mecalc.core.DispatchedCommand("Return 1 if x=y, 0 otherwise.", "relational");
                    core_commands.MeNotEqualsDispatch = new mecalc.core.DispatchedCommand("Return 1 if x<>y, 0 otherwise.", "relational");
                    core_commands.MeSizeDispatch = new mecalc.core.DispatchedCommand("Return size of operand.", "core");
                    core_commands.MeConjDispatch = new mecalc.core.DispatchedCommand("Return conjugate of operand.", "math");
                    var MeCoreDispatchedCommands = {
                        "plus": core_commands.MePlusDispatch,
                        "+": core_commands.MePlusDispatch,
                        "minus": core_commands.MeMinusDispatch,
                        "-": core_commands.MeMinusDispatch,
                        "times": core_commands.MeTimesDispatch,
                        "*": core_commands.MeTimesDispatch,
                        "divide": core_commands.MeDivideDispatch,
                        "/": core_commands.MeDivideDispatch,
                        "negate": core_commands.MeNegateDispatch,
                        "inv": core_commands.MeInverseDispatch,
                        "conj": core_commands.MeConjDispatch,
                        "exp": core_commands.MeExpDispatch,
                        "sqrt": core_commands.MeSqrtDispatch,
                        "abs": core_commands.MeAbsDispatch,
                        "ln": core_commands.MeLnDispatch,
                        "pow": core_commands.MePowDispatch,
                        "sqr": core_commands.MeSqrDispatch,
                        "gt": core_commands.MeGreaterThanDispatch,
                        ">": core_commands.MeGreaterThanDispatch,
                        "gte": core_commands.MeGreaterThanEqualsDispatch,
                        ">=": core_commands.MeGreaterThanEqualsDispatch,
                        "lt": core_commands.MeLessThanDispatch,
                        "<": core_commands.MeLessThanDispatch,
                        "lte": core_commands.MeLessThanEqualsDispatch,
                        "<=": core_commands.MeLessThanEqualsDispatch,
                        "eq": core_commands.MeEqualsDispatch,
                        "=": core_commands.MeEqualsDispatch,
                        "neq": core_commands.MeNotEqualsDispatch,
                        "<>": core_commands.MeNotEqualsDispatch,
                        "size": core_commands.MeSizeDispatch
                    };
                    mecalc.core.calculator.registerBuiltins(MeCoreDispatchedCommands);
                })(core_commands = calclib.core_commands || (calclib.core_commands = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var scalars;
                (function (scalars) {
                    /////////////////////////////////////////////////////////////////////////////////
                    // Floating point number stack object
                    ////////////////////////////////////////////////////////////////////////////////
                    class MeFloat extends mecalc.core.StackObject {
                        constructor(aNum) {
                            super();
                            this._value = aNum;
                        }
                        static sParse(aStr) {
                            const floatRe = /^(([+\-]?[0-9]+(\.[0-9]*)?)|(\.[0-9]*))(e[+\-]?[0-9]+)?/;
                            var lMatchRes = floatRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new MeFloat(parseFloat(aStr)));
                            }
                            else {
                                return null;
                            }
                        }
                        get value() { return this._value; }
                        stackDisplayString() {
                            return this.value.toString();
                        }
                        conj() {
                            return this;
                        }
                        neq(aOp) {
                            return this.value != aOp.value;
                        }
                        eq(aOp) {
                            return this.value == aOp.value;
                        }
                    }
                    MeFloat.readableName = "MeFloat";
                    scalars.MeFloat = MeFloat;
                    /////////////////////////////////////////////////////////////////////////////////
                    // Floating number functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function EnsureNumeric(aVal) {
                        if (isNaN(aVal))
                            throw new mecalc.core.MeException("Result not a number");
                        if (!isFinite(aVal))
                            throw new mecalc.core.MeException("Infinite result");
                        return aVal;
                    }
                    scalars.EnsureNumeric = EnsureNumeric;
                    function FltAdd(a1, a2) {
                        return new MeFloat(a1.value + a2.value);
                    }
                    function FltSub(a1, a2) {
                        return new MeFloat(a1.value - a2.value);
                    }
                    function FltMul(a1, a2) {
                        return new MeFloat(a1.value * a2.value);
                    }
                    function FltDiv(a1, a2) {
                        if (!a2.value) {
                            throw new mecalc.core.MeException("Division by zero");
                        }
                        return new MeFloat(a1.value / a2.value);
                    }
                    function FltGreaterThan(a1, a2) {
                        return new MeFloat(a1.value > a2.value ? 1 : 0);
                    }
                    function FltLessThan(a1, a2) {
                        return new MeFloat(a1.value < a2.value ? 1 : 0);
                    }
                    function FltGreaterThanEquals(a1, a2) {
                        return new MeFloat(a1.value >= a2.value ? 1 : 0);
                    }
                    function FltLessThanEquals(a1, a2) {
                        return new MeFloat(a1.value <= a2.value ? 1 : 0);
                    }
                    function FltEquals(a1, a2) {
                        return new MeFloat(a1.eq(a2) ? 1 : 0);
                    }
                    function FltNotEquals(a1, a2) {
                        return new MeFloat(a1.neq(a2) ? 1 : 0);
                    }
                    function FltNeg(a1, a2) {
                        return new MeFloat(-a1.value);
                    }
                    function FltInv(a1, a2) {
                        return new MeFloat(1 / a1.value);
                    }
                    function FltPow(a1, a2) {
                        return new MeFloat(Math.pow(a1.value, a2.value));
                    }
                    function FltSqrt(a1, a2) {
                        if (a1.value >= 0) {
                            return new MeFloat(Math.sqrt(a1.value));
                        }
                        else {
                            var ca1 = mecalc.core.Conversions.convert(a1, calclib.scalars.MeComplex);
                            return calclib.core_commands.MeSqrtDispatch.directApply(ca1);
                        }
                    }
                    function FltRand(aCmd, aStk) {
                        aStk.push(new MeFloat(Math.random()));
                    }
                    function FltConj(a1) {
                        return a1.conj();
                    }
                    function MakeFltMathRoutine(aFn, aDocStr) {
                        return new mecalc.core.JsCommand(function (cmd, stk) {
                            var lO = stk.pop();
                            let newVal = aFn(lO.value);
                            EnsureNumeric(newVal);
                            stk.push(new MeFloat(newVal));
                        }, [MeFloat], aDocStr);
                    }
                    function MakeFltDispMathRoutine(aFn) {
                        return function (a1) {
                            var nVal = aFn(a1.value);
                            EnsureNumeric(nVal);
                            return new MeFloat(nVal);
                        };
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // Floating point number registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Class
                    mecalc.core.StackObject.registerStackObjectClass(MeFloat);
                    mecalc.core.calculator.parser.registerParser(MeFloat.sParse);
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltAdd);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltSub);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltMul);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltDiv);
                    calclib.core_commands.MeNegateDispatch.registerDispatchOptionFn([MeFloat], FltNeg);
                    calclib.core_commands.MeInverseDispatch.registerDispatchOptionFn([MeFloat], FltInv);
                    calclib.core_commands.MeConjDispatch.registerDispatchOptionFn([MeFloat], FltConj);
                    calclib.core_commands.MeExpDispatch.registerDispatchOptionFn([MeFloat], MakeFltDispMathRoutine(Math.exp));
                    calclib.core_commands.MeSqrtDispatch.registerDispatchOptionFn([MeFloat], FltSqrt);
                    calclib.core_commands.MeAbsDispatch.registerDispatchOptionFn([MeFloat], MakeFltDispMathRoutine(Math.abs));
                    calclib.core_commands.MeLnDispatch.registerDispatchOptionFn([MeFloat], MakeFltDispMathRoutine(Math.log));
                    calclib.core_commands.MePowDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltPow);
                    calclib.core_commands.MeSqrDispatch.registerDispatchOptionFn([MeFloat], MakeFltDispMathRoutine(function (x) { return x * x; }));
                    calclib.core_commands.MeGreaterThanDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltGreaterThan);
                    calclib.core_commands.MeLessThanDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltLessThan);
                    calclib.core_commands.MeGreaterThanEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltGreaterThanEquals);
                    calclib.core_commands.MeLessThanEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltLessThanEquals);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltEquals);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltNotEquals);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        'sin': MakeFltMathRoutine(Math.sin, "Calculate the sine of the argument."),
                        'tan': MakeFltMathRoutine(Math.tan, "Calculate the tangent of the argument."),
                        'cos': MakeFltMathRoutine(Math.cos, "Calculate the cosine of the argument."),
                        'asin': MakeFltMathRoutine(Math.asin, "Calculate the arc-sine of the argument."),
                        'atan': MakeFltMathRoutine(Math.atan, "Calculate the arc-tangent of the argument."),
                        'acos': MakeFltMathRoutine(Math.acos, "Calculate the arc-cosine of the argument."),
                        'floor': MakeFltMathRoutine(Math.floor, "Return the largest integer smaller than or equal to the argument."),
                        'ceil': MakeFltMathRoutine(Math.ceil, "Return the smallest integer larger than or equal to the argument."),
                        'rand': new mecalc.core.JsCommand(FltRand, [], "Return a pseudo random number between 0 and 1", "math")
                    });
                })(scalars = calclib.scalars || (calclib.scalars = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../core/MeCalculator.ts"/>
/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>
/// <reference path="scalars/MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var core_commands;
                (function (core_commands) {
                    /////////////////////////////////////////////////////////////////////////
                    /// Stack operations 
                    /////////////////////////////////////////////////////////////////////////
                    var FnCommands = {};
                    var MeCoreJsCommands = {
                        drop: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.pop();
                        }, ["*"], "Drop the front of the stack.", "stack"),
                        drop2: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.popMultiple(2);
                        }, ["*", "*"], "Drop two elements from the stack.", "stack"),
                        dropch: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.dropAt(stk.pop().value);
                        }, [calclib.scalars.MeFloat], "Drop an element from the stack, with slot identified by x.", "stack"),
                        swap: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.pop();
                            var v2 = stk.pop();
                            stk.push(v1);
                            stk.push(v2);
                        }, ["*", "*"], "Swap x and y.", "stack"),
                        clear: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.clear();
                        }, [], "Clear the stack.", "stack"),
                        count: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.push(new calclib.scalars.MeFloat(stk.size()));
                        }, [], "Count number of items in the stack.", "stack"),
                        dup: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.item(1);
                            stk.push(v1.dup());
                        }, ["*"], "Duplicate the bottom object on the stack.", "stack"),
                        over: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.item(2);
                            stk.push(v1.dup());
                        }, ["*", "*"], "Push a copy of stack slot 'y' onto the stack.", "stack"),
                        dup2: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.item(2);
                            stk.push(v1.dup());
                            v1 = stk.item(2);
                            stk.push(v1.dup());
                        }, ["*", "*"], "Push a copy of stack slot 'y' onto the stack.", "stack"),
                        choose: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.pop();
                            v1 = stk.item(v1.value);
                            stk.push(v1.dup());
                        }, [calclib.scalars.MeFloat], "Pop slot number; push a copy of the object in that slot onto the stack.", "stack"),
                        rot: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popMultiple(3);
                            stk.pushMultiple([v1[1], v1[2], v1[0]]);
                        }, ["*", "*", "*"], "Rotate bottom three stack slots.", "stack"),
                        unrot: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popMultiple(3);
                            stk.pushMultiple([v1[2], v1[0], v1[1]]);
                        }, ["*", "*", "*"], "Unrotate bottom three stack slots.", "stack"),
                        exe: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.pop();
                            v1.doExec(stk);
                        }, ["*"], "Execute x.")
                    };
                    mecalc.core.calculator.registerBuiltins(MeCoreJsCommands);
                })(core_commands = calclib.core_commands || (calclib.core_commands = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>
/// <reference path="scalars/MeFloat.ts"/>
/// <reference path="CoreCommands.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var boolean_commands;
                (function (boolean_commands) {
                    var MeBoolCommands = {
                        land: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popWithType(calclib.scalars.MeFloat).value;
                            var v2 = stk.popWithType(calclib.scalars.MeFloat).value;
                            stk.push(new calclib.scalars.MeFloat((v1 !== 0 && v2 !== 0) ? 1 : 0));
                        }, [calclib.scalars.MeFloat, calclib.scalars.MeFloat], "Return 1 if x<>0 and y<>0; return 0 otherwise."),
                        lor: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popWithType(calclib.scalars.MeFloat).value;
                            var v2 = stk.popWithType(calclib.scalars.MeFloat).value;
                            stk.push(new calclib.scalars.MeFloat((v1 !== 0 || v2 !== 0) ? 1 : 0));
                        }, [calclib.scalars.MeFloat, calclib.scalars.MeFloat], "Return 1 if x<>0 or y<>0; return 0 otherwise."),
                        lnot: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popWithType(calclib.scalars.MeFloat).value;
                            stk.push(new calclib.scalars.MeFloat((v1 !== 0) ? 0 : 1));
                        }, [calclib.scalars.MeFloat], "Return 1 if x=0; return 0 otherwise.")
                    };
                    mecalc.core.calculator.registerBuiltins(MeBoolCommands);
                })(boolean_commands = calclib.boolean_commands || (calclib.boolean_commands = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class ObjectArchive {
                }
                core.ObjectArchive = ObjectArchive;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/ObjectArchive.ts"/>
/// <reference path="../../core/MeCalculator.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var filesys;
                (function (filesys) {
                    class Symbol extends mecalc.core.StackObject {
                        constructor(aSymName) {
                            super();
                            this._name = aSymName;
                        }
                        static sParse(aStr) {
                            const parseRe = /^\'([a-zA-Z0-9_]+)\'/;
                            var lMatchRes = parseRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new Symbol(lMatchRes[1]));
                            }
                            else {
                                return null;
                            }
                        }
                        stackDisplayString() {
                            return "'" + this.name + "'";
                        }
                        get name() {
                            return this._name;
                        }
                    }
                    Symbol.readableName = "Symbol";
                    filesys.Symbol = Symbol;
                    mecalc.core.StackObject.registerStackObjectClass(Symbol);
                    mecalc.core.calculator.parser.registerParser(Symbol.sParse);
                })(filesys = calclib.filesys || (calclib.filesys = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/ObjectArchive.ts"/>
/// <reference path="./Symbol.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var filesys;
                (function (filesys) {
                    class Directory extends mecalc.core.StackObject {
                        constructor(name, parent) {
                            super();
                            this._name = name;
                            this._contents = {};
                            this._parent = parent;
                        }
                        archiveStore(aArchive) {
                            aArchive.writeProperty("name", this._name);
                            aArchive.writeContainerStart("contents");
                            for (var lContentName in this._contents) {
                                aArchive.writeContainerStart("item");
                                aArchive.writeProperty("n", lContentName);
                                aArchive.writeObject("d", this._contents[lContentName]);
                                aArchive.writeContainerEnd();
                            }
                            aArchive.writeContainerEnd();
                        }
                        archiveLoad(aArchive) {
                            this._name = aArchive.readProperty("name").value;
                            var cst = aArchive.readContainerStart("contents");
                            while (aArchive.containerHasMoreData()) {
                                aArchive.readContainerStart("item");
                                var lContentName = aArchive.readProperty("n").value;
                                var lObj = aArchive.readObject("d").value;
                                this._contents[lContentName] = lObj;
                                if (lObj instanceof Directory) {
                                    lObj._parent = this;
                                }
                                aArchive.readContainerEnd();
                            }
                            aArchive.readContainerEnd();
                        }
                        stackDisplayString() {
                            return "&lt;Directory " + this._name + "&gt;";
                        }
                        doExec(aStk) {
                            mecalc.core.calculator.changeDir(this);
                        }
                        get parent() {
                            return this._parent;
                        }
                        get name() {
                            return this._name;
                        }
                        store(aSym, aObj) {
                            if (this._contents[aSym.name])
                                this._contents[aSym.name].retire();
                            let storedObj = aObj.dup();
                            if (storedObj instanceof Directory) {
                                storedObj._parent = this;
                            }
                            this._contents[aSym.name] = storedObj;
                        }
                        recall(aSym) {
                            return this._contents[aSym.name];
                        }
                        getByString(aStr) {
                            return this._contents[aStr];
                        }
                        purge(aSym) {
                            var ret = this._contents[aSym.name];
                            delete this._contents[aSym.name];
                            ret.retire();
                        }
                        dup() {
                            var ret = new Directory(this.name);
                            var lOrgName;
                            for (lOrgName in this._contents) {
                                ret._contents[lOrgName] = this._contents[lOrgName].dup();
                            }
                            return ret;
                        }
                        retire() {
                            var lOrgName;
                            for (lOrgName in this._contents) {
                                this._contents[lOrgName].retire();
                            }
                        }
                    }
                    Directory.readableName = "Directory";
                    filesys.Directory = Directory;
                    mecalc.core.StackObject.registerStackObjectClass(Directory);
                })(filesys = calclib.filesys || (calclib.filesys = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/MeCalculator.ts"/>
/// <reference path="../../core/JsCommand.ts"/>
/// <reference path="../../core/DispatchedCommand.ts"/>
///! <reference path="../scalars/MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var filesys;
                (function (filesys) {
                    var dirCommands = {
                        rcl: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lSym = stk.popWithType(filesys.Symbol);
                            var lVal = mecalc.core.calculator.currentDir.recall(lSym);
                            if (!lVal) {
                                throw new mecalc.core.MeException("Symbol not found.");
                            }
                            stk.push(lVal.dup());
                        }, [filesys.Symbol], "Recall a variable's value in the current directory to the stack.", "files"),
                        sto: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lSym = stk.popWithType(filesys.Symbol);
                            var lObj = stk.pop();
                            var lDir = mecalc.core.calculator.currentDir;
                            lDir.store(lSym, lObj);
                            mecalc.core.calculator.notifyFsChange('sto', lDir, lSym.name, lObj);
                        }, ["*", filesys.Symbol], "Store an object to a variable in the current directory.", "files"),
                        purge: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lSym = stk.popWithType(filesys.Symbol);
                            var lDir = mecalc.core.calculator.currentDir;
                            lDir.purge(lSym);
                            mecalc.core.calculator.notifyFsChange('purge', lDir, lSym.name);
                        }, [filesys.Symbol], "Delete a variable from the current directory.", "files"),
                        updir: new mecalc.core.JsCommand(function (cmd, stk) {
                            if (mecalc.core.calculator.currentDir.parent) {
                                mecalc.core.calculator.changeDir(mecalc.core.calculator.currentDir.parent);
                            }
                            else {
                                throw new mecalc.core.MeException("Cannot UPDIR from HOME.");
                            }
                        }, [], "Change the current directory to the parent of the current directory.", "files"),
                        crdir: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lSym = stk.popWithType(filesys.Symbol);
                            var lCurDir = mecalc.core.calculator.currentDir;
                            var lNewDir = new filesys.Directory(lSym.name, lCurDir);
                            lCurDir.store(lSym, lNewDir);
                            mecalc.core.calculator.notifyFsChange('sto', lCurDir, lSym.name, lNewDir);
                        }, [filesys.Symbol], "Create a new directory under the current directory named after the current symbol.", "files"),
                        chdir: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lDir = stk.popWithType(filesys.Directory);
                            mecalc.core.calculator.changeDir(lDir);
                        }, [filesys.Directory], "Change the current directory to the directory pushed to the stack.", "files"),
                        home: new mecalc.core.JsCommand(function (cmd, stk) {
                            mecalc.core.calculator.changeDir(mecalc.core.calculator.homeDir);
                        }, [], "Set the current directory to HOME.", "files")
                    };
                    mecalc.core.calculator.registerBuiltins(dirCommands);
                })(filesys = calclib.filesys || (calclib.filesys = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var scalars;
                (function (scalars) {
                    class MeComplex extends mecalc.core.StackObject {
                        constructor(aReal, aImag) {
                            super();
                            this._realVal = aReal;
                            this._imageVal = aImag;
                        }
                        get realVal() { return this._realVal; }
                        get imageVal() { return this._imageVal; }
                        static sParse(aStr) {
                            const complexRe = /^\(([+\-]?[0-9]+(\.[0-9]*)?(e[+\-]?[0-9]+)?)\s*,\s*([+\-]?[0-9]+(\.[0-9]*)?(e[+\-]?[0-9]+)?)\)/;
                            var lMatchRes = complexRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new MeComplex(parseFloat(lMatchRes[1]), parseFloat(lMatchRes[4])));
                            }
                            else {
                                return null;
                            }
                        }
                        stackDisplayString() {
                            var realPart;
                            var imagePart;
                            var condBr;
                            realPart = this.realVal.toString();
                            imagePart = Math.abs(this.imageVal).toString();
                            condBr = (realPart.length + imagePart.length > 20) ? "<br/>" : "";
                            return realPart + (this.imageVal >= 0 ? "+" : "-") + condBr + imagePart + "i";
                        }
                        unparse() {
                            var realPart;
                            var imagePart;
                            realPart = this.realVal.toString();
                            imagePart = Math.abs(this.imageVal).toString();
                            return "(" + realPart + ", " + imagePart + ")";
                        }
                        arg() {
                            if (this.realVal === 0) {
                                return this.imageVal === 0 ? 0 : ((this.imageVal > 0 ? 1 : 3) * Math.PI / 2);
                            }
                            else {
                                var lBaseAng = Math.atan(this.imageVal / this.realVal) + (this.realVal > 0 ? 0 : Math.PI);
                                return (lBaseAng < 0) ? lBaseAng + Math.PI * 2 : lBaseAng;
                            }
                        }
                        abs() {
                            return Math.sqrt(this.realVal * this.realVal + this.imageVal * this.imageVal);
                        }
                        pow(aExpo) {
                            let lExpo = aExpo;
                            let lBase = this;
                            let lBaseArg = lBase.arg();
                            let lBaseAbs = lBase.abs();
                            // First -- calculate base^(re(exp))
                            let lRealExpAbs = Math.pow(lBaseAbs, lExpo.realVal);
                            let lRealExpArg = lBaseArg * lExpo.realVal;
                            // Next -- calculate base^im(exp); we calclculate its ln
                            let lImageExpLnImag = Math.log(lBaseAbs) * lExpo.imageVal;
                            let lImageExpLnReal = -lBaseArg * lExpo.imageVal;
                            // And now the result value
                            let lRetArg = lRealExpArg + lImageExpLnImag;
                            let lRetAbs = lRealExpAbs * Math.exp(lImageExpLnReal);
                            let lRetReal = lRetAbs * Math.cos(lRetArg);
                            let lRetImag = lRetAbs * Math.sin(lRetArg);
                            return new MeComplex(lRetReal, lRetImag);
                        }
                        sqrt() {
                            if (this.imageVal === 0) {
                                if (this.realVal >= 0) {
                                    return new MeComplex(Math.sqrt(this.realVal), 0);
                                }
                                else {
                                    return new MeComplex(0, Math.sqrt(-this.realVal));
                                }
                            }
                            else {
                                return this.pow(new MeComplex(0.5, 0));
                            }
                        }
                        exp() {
                            var lResAbs = Math.exp(this.realVal);
                            return new MeComplex(lResAbs * Math.cos(this.imageVal), lResAbs * Math.sin(this.imageVal));
                        }
                        ln() {
                            return new MeComplex(scalars.EnsureNumeric(Math.log(this.abs())), this.arg());
                        }
                        conj() {
                            return new MeComplex(this.realVal, -this.imageVal);
                        }
                        eq(aOp) {
                            return (aOp instanceof MeComplex) && this.realVal == aOp.realVal && this.imageVal == aOp.imageVal;
                        }
                        neq(aOp) {
                            return !this.eq(aOp);
                        }
                    }
                    MeComplex.readableName = "MeComplex";
                    scalars.MeComplex = MeComplex;
                    /////////////////////////////////////////////////////////////////////////////////
                    // Complex number functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function CplxAdd(a1, a2) {
                        return new MeComplex(a1.realVal + a2.realVal, a1.imageVal + a2.imageVal);
                    }
                    function CplxSub(a1, a2) {
                        return new MeComplex(a1.realVal - a2.realVal, a1.imageVal - a2.imageVal);
                    }
                    function CplxMul(a1, a2) {
                        return new MeComplex(a1.realVal * a2.realVal - a1.imageVal * a2.imageVal, a1.realVal * a2.imageVal + a1.imageVal * a2.realVal);
                    }
                    function CplxDiv(a1, a2) {
                        var lRlDenom = a2.realVal * a2.realVal + a2.imageVal * a2.imageVal;
                        if (!lRlDenom) {
                            throw new mecalc.core.MeException("Division by zero");
                        }
                        return new MeComplex((a1.realVal * a2.realVal + a1.imageVal * a2.imageVal) / lRlDenom, (-a1.realVal * a2.imageVal + a1.imageVal * a2.realVal) / lRlDenom);
                    }
                    function CplxNeg(a1) {
                        return new MeComplex(-a1.realVal, -a1.imageVal);
                    }
                    function CplxInv(a1) {
                        var lMagna = a1.realVal * a1.realVal + a1.imageVal * a1.imageVal;
                        if (!lMagna) {
                            throw new mecalc.core.MeException("Division by zero");
                        }
                        return new MeComplex(a1.realVal / lMagna, -a1.imageVal / lMagna);
                    }
                    function CplxAbs(a1) {
                        return new scalars.MeFloat(a1.abs());
                    }
                    function CplxArg(aCmd, aStk) {
                        var a1 = aStk.popWithType(MeComplex);
                        aStk.push(new scalars.MeFloat(a1.arg()));
                    }
                    function Cplxr2c(aCmd, aStk) {
                        var im = aStk.popWithType(scalars.MeFloat);
                        var rl = aStk.popWithType(scalars.MeFloat);
                        aStk.push(new MeComplex(rl.value, im.value));
                    }
                    function Cplxc2r(aCmd, aStk) {
                        var a1 = aStk.popWithType(MeComplex);
                        aStk.push(new scalars.MeFloat(a1.realVal));
                        aStk.push(new scalars.MeFloat(a1.imageVal));
                    }
                    function CplxPow(aBase, aExpo) {
                        return aBase.pow(aExpo);
                    }
                    function CplxSqr(aBase) {
                        return aBase.pow(new MeComplex(2, 0));
                    }
                    function CplxSqrt(a1) {
                        return a1.sqrt();
                    }
                    function CplxExp(aExp) {
                        return aExp.exp();
                    }
                    function CplxLn(aArg) {
                        return aArg.ln();
                    }
                    function CplxConj(aArg) {
                        return aArg.conj();
                    }
                    function CplxNeq(aArg1, aArg2) {
                        return aArg1.neq(aArg2) ? new scalars.MeFloat(1) : new scalars.MeFloat(0);
                    }
                    function CplxEq(aArg1, aArg2) {
                        return aArg1.eq(aArg2) ? new scalars.MeFloat(1) : new scalars.MeFloat(0);
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // Complex number registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Class
                    mecalc.core.StackObject.registerStackObjectClass(MeComplex);
                    mecalc.core.calculator.parser.registerParser(MeComplex.sParse);
                    // Conversions
                    mecalc.core.Conversions.registerConversion(scalars.MeFloat, MeComplex, (n) => new MeComplex(n.value, 0));
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxAdd);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxSub);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxMul);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxDiv);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeNegateDispatch.registerDispatchOptionFn([MeComplex], CplxNeg);
                    calclib.core_commands.MePowDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxPow);
                    calclib.core_commands.MePowDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MePowDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeInverseDispatch.registerDispatchOptionFn([MeComplex], CplxInv);
                    calclib.core_commands.MeAbsDispatch.registerDispatchOptionFn([MeComplex], CplxAbs);
                    calclib.core_commands.MeSqrDispatch.registerDispatchOptionFn([MeComplex], CplxSqr);
                    calclib.core_commands.MeSqrtDispatch.registerDispatchOptionFn([MeComplex], CplxSqrt);
                    calclib.core_commands.MeExpDispatch.registerDispatchOptionFn([MeComplex], CplxExp);
                    calclib.core_commands.MeLnDispatch.registerDispatchOptionFn([MeComplex], CplxLn);
                    calclib.core_commands.MeConjDispatch.registerDispatchOptionFn([MeComplex], CplxConj);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxEq);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxNeq);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        'arg': new mecalc.core.JsCommand(CplxArg, [MeComplex], "Return the argument of the phasor representing the argument."),
                        'r2c': new mecalc.core.JsCommand(Cplxr2c, [scalars.MeFloat, scalars.MeFloat], "Create a complex from real and imaginary parts."),
                        'c2r': new mecalc.core.JsCommand(Cplxc2r, [MeComplex], "Break complex into real and imaginary parts")
                    });
                })(scalars = calclib.scalars || (calclib.scalars = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="../scalars/MeFloat.ts"/>
/// <reference path="../scalars/MeComplexNumbers.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var linear;
                (function (linear) {
                    /////////////////////////////////////////////////////////////////////////////////
                    // Floating point number stack object
                    ////////////////////////////////////////////////////////////////////////////////
                    class MeVector extends mecalc.core.RefCountedStackObject {
                        constructor(aVec) {
                            super();
                            this._valuesVector = aVec;
                        }
                        get valuesVector() {
                            return this._valuesVector;
                        }
                        static sParseVectorValues(aStr) {
                            var retVec = [];
                            while (true) {
                                aStr = aStr.replace(/^\s*/, "");
                                if (aStr.length) {
                                    var lParseRes = calclib.scalars.MeFloat.sParse(aStr) || calclib.scalars.MeComplex.sParse(aStr);
                                    if (lParseRes) {
                                        retVec.push(lParseRes.obj);
                                        aStr = aStr.substring(lParseRes.len, aStr.length);
                                    }
                                    else {
                                        return null;
                                    }
                                }
                                else {
                                    break;
                                }
                            }
                            return retVec;
                        }
                        static sParse(aStr) {
                            const vectorRe = /^\[([^\[]+)\]/;
                            var lMatchRes = vectorRe.exec(aStr);
                            if (lMatchRes) {
                                var lVals = MeVector.sParseVectorValues(lMatchRes[1]);
                                return lVals ? new mecalc.core.ParserResult(lMatchRes[0].length, new MeVector(lVals)) : null;
                            }
                            else {
                                return null;
                            }
                        }
                        stackDisplayString() {
                            var lStr = "";
                            var lIdx;
                            for (lIdx = 0; lIdx < this._valuesVector.length && lStr.length < 20; lIdx++) {
                                lStr += this._valuesVector[lIdx].stackDisplayString() + " ";
                            }
                            if (lIdx < this._valuesVector.length) {
                                lStr += "...";
                            }
                            return "[ " + lStr + "]";
                        }
                        doEval(aStk) {
                            aStk.push(this);
                        }
                        get(aIdx) {
                            if (aIdx < 0 || aIdx >= this._valuesVector.length) {
                                throw new mecalc.core.MeException("Subscript out of range.");
                            }
                            return this._valuesVector[aIdx];
                        }
                        set(aIdx, aValue) {
                            if (aIdx < 0 || aIdx >= this._valuesVector.length) {
                                throw new mecalc.core.MeException("Subscript out of range.");
                            }
                            if (!(aValue instanceof calclib.scalars.MeFloat || aValue instanceof calclib.scalars.MeComplex)) {
                                throw new mecalc.core.MeException("Vectors can only contain floats or complex values.");
                            }
                            this._valuesVector[aIdx].retire();
                            this._valuesVector[aIdx] = aValue;
                        }
                        retiringLastRef() {
                            var lIdx;
                            for (lIdx in this._valuesVector) {
                                this._valuesVector[lIdx].retire();
                            }
                        }
                        swapForWritable(aRetireObject) {
                            if (this.refCount == 1) {
                                return this.dup();
                            }
                            else {
                                var lNewVec = [];
                                var lIdx;
                                for (lIdx in this._valuesVector) {
                                    lNewVec[lIdx] = this._valuesVector[lIdx].dup();
                                }
                                if (aRetireObject)
                                    this.retire();
                                return new MeVector(lNewVec);
                            }
                        }
                    }
                    MeVector.readableName = "MeVector";
                    linear.MeVector = MeVector;
                    // Class
                    mecalc.core.StackObject.registerStackObjectClass(MeVector);
                    mecalc.core.calculator.parser.registerParser(MeVector.sParse);
                    /////////////////////////////////////////////////////////////////////////////////
                    // Vector functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function VectorInnerProduct(a1, a2) {
                        if (a1.valuesVector.length != a2.valuesVector.length) {
                            throw new mecalc.core.MeException("Vector dimensions mismatch");
                        }
                        var tsum = calclib.core_commands.MeTimesDispatch.directApply(a1.valuesVector[0], a2.valuesVector[0].conj());
                        for (var lIdx = 1; lIdx < a1.valuesVector.length; lIdx++) {
                            tsum = calclib.core_commands.MePlusDispatch.directApply(tsum, calclib.core_commands.MeTimesDispatch.directApply(a1.valuesVector[lIdx], a2.valuesVector[lIdx].conj()));
                        }
                        return tsum;
                    }
                    function VectorAbs(a1) {
                        return calclib.core_commands.MeSqrtDispatch.directApply(VectorInnerProduct(a1, a1));
                    }
                    function VectorEquals(a1, a2) {
                        if (a1.valuesVector.length != a2.valuesVector.length) {
                            throw new mecalc.core.MeException("Vector dimensions mismatch");
                        }
                        for (var lIdx = 0; lIdx < a1.valuesVector.length; lIdx++) {
                            if (!a1.valuesVector[lIdx].eq(a2.valuesVector[lIdx])) {
                                return new calclib.scalars.MeFloat(0);
                            }
                        }
                        return new calclib.scalars.MeFloat(1);
                    }
                    function VectorNotEquals(a1, a2) {
                        if (a1.valuesVector.length != a2.valuesVector.length) {
                            throw new mecalc.core.MeException("Vector dimensions mismatch");
                        }
                        for (var lIdx = 0; lIdx < a1.valuesVector.length; lIdx++) {
                            if (!a1.valuesVector[lIdx].neq(a2.valuesVector[lIdx])) {
                                return new calclib.scalars.MeFloat(0);
                            }
                        }
                        return new calclib.scalars.MeFloat(1);
                    }
                    function VectorMakeVec(aCmd, aStk) {
                        var vlen = aStk.popWithType(calclib.scalars.MeFloat).value;
                        var data = [];
                        while (vlen--) {
                            data.push(new calclib.scalars.MeFloat(0));
                        }
                        aStk.push(new MeVector(data));
                    }
                    function VectorGet(aCmd, aStk) {
                        var idx = aStk.popWithType(calclib.scalars.MeFloat).value;
                        var vec = aStk.popWithType(MeVector);
                        aStk.push(vec.get(idx).dup());
                    }
                    function VectorPut(aCmd, aStk) {
                        var val = aStk.pop();
                        var idx = aStk.popWithType(calclib.scalars.MeFloat);
                        var vec = aStk.popWithType(MeVector);
                        vec = vec.swapForWritable(true);
                        vec.set(idx.value, val);
                        aStk.push(vec);
                        idx.retire();
                    }
                    function VectorSize(aVec) {
                        return new calclib.scalars.MeFloat(aVec.valuesVector.length);
                    }
                    function makeVectorMapper(aDispatcher) {
                        return function (a1, a2) {
                            if (a1.valuesVector.length != a2.valuesVector.length) {
                                throw new mecalc.core.MeException("Vector dimensions mismatch");
                            }
                            var lResultVec = [];
                            for (var lIdx = 0; lIdx < a1.valuesVector.length; lIdx++) {
                                lResultVec.push(aDispatcher.directApply(a1.valuesVector[lIdx], a2.valuesVector[lIdx]));
                            }
                            return new MeVector(lResultVec);
                        };
                    }
                    function makeVectorScalarMapper(aDispatcher, aReverse) {
                        return function (vec, sc) {
                            if (aReverse) {
                                var t = sc;
                                sc = vec;
                                vec = t;
                            }
                            var lResultVec = [];
                            for (var lIdx = 0; lIdx < vec.valuesVector.length; lIdx++) {
                                lResultVec.push(aDispatcher.directApply(vec.valuesVector[lIdx], sc));
                            }
                            return new MeVector(lResultVec);
                        };
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // Vector registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOptionFn([MeVector, MeVector], makeVectorMapper(calclib.core_commands.MePlusDispatch));
                    calclib.core_commands.MeMinusDispatch.registerDispatchOptionFn([MeVector, MeVector], makeVectorMapper(calclib.core_commands.MeMinusDispatch));
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorInnerProduct);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, calclib.scalars.MeComplex], makeVectorScalarMapper(calclib.core_commands.MeTimesDispatch, false));
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([calclib.scalars.MeComplex, MeVector], makeVectorScalarMapper(calclib.core_commands.MeTimesDispatch, true));
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, calclib.scalars.MeFloat], makeVectorScalarMapper(calclib.core_commands.MeTimesDispatch, false));
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([calclib.scalars.MeFloat, MeVector], makeVectorScalarMapper(calclib.core_commands.MeTimesDispatch, true));
                    calclib.core_commands.MeDivideDispatch.registerDispatchOptionFn([MeVector, calclib.scalars.MeComplex], makeVectorScalarMapper(calclib.core_commands.MeDivideDispatch, false));
                    calclib.core_commands.MeDivideDispatch.registerDispatchOptionFn([MeVector, calclib.scalars.MeFloat], makeVectorScalarMapper(calclib.core_commands.MeDivideDispatch, false));
                    calclib.core_commands.MeAbsDispatch.registerDispatchOptionFn([MeVector], VectorAbs);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorEquals);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorNotEquals);
                    calclib.core_commands.MeSizeDispatch.registerDispatchOptionFn([MeVector], VectorSize);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        //    'cross' //'hex' : MakeBinBaseChangeFunction("h", "hexadecimal"),
                        'makevec': new mecalc.core.JsCommand(VectorMakeVec, [calclib.scalars.MeFloat], "Make vector of size specified in stack, consisting of zeroes.", "vectors"),
                        'get': new mecalc.core.JsCommand(VectorGet, [MeVector, calclib.scalars.MeFloat], "Return vector (y) element by index (x)", "vectors"),
                        'put': new mecalc.core.JsCommand(VectorPut, [MeVector, calclib.scalars.MeFloat, "*"], "Put value (x) in index (y) of vector (z)", "vectors")
                    });
                })(linear = calclib.linear || (calclib.linear = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    class MeProgram extends mecalc.core.RefCountedStackObject {
                        constructor(aSrc, aCompiledProgramBlock) {
                            super();
                            this._sourceCode = aSrc;
                            this._compiledProgramBlock = aCompiledProgramBlock;
                            return this;
                        }
                        doExec(aStk) {
                            var lContext = new mecalc.core.ProgramExecutionContext(null, aStk);
                            mecalc.core.calculator.pushExecContext(lContext);
                            this._compiledProgramBlock.exec(lContext);
                            mecalc.core.calculator.popExecContext();
                            lContext.retire();
                        }
                        archiveStore(aArchive) {
                            aArchive.writeProperty("sourceCode", this._sourceCode);
                        }
                        archiveLoad(aArchive) {
                            var lProg = program.ProgramParser.parse(aArchive.readProperty("sourceCode").value).obj;
                            this._sourceCode = lProg._sourceCode;
                            this._compiledProgramBlock = lProg._compiledProgramBlock;
                        }
                        retiringLastRef() {
                            this._compiledProgramBlock.retire();
                        }
                        stackDisplayString() {
                            return this._sourceCode;
                        }
                    }
                    MeProgram.readableName = "MeProgram";
                    program.MeProgram = MeProgram;
                    mecalc.core.StackObject.registerStackObjectClass(MeProgram);
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramBlock {
                            constructor(aSteps) {
                                this._steps = aSteps;
                                return this;
                            }
                            retire() {
                                this._steps.forEach((s) => s.retire());
                            }
                            exec(aContext) {
                                this._steps.forEach((s) => s.exec(aContext));
                            }
                        }
                        instr.MeProgramBlock = MeProgramBlock;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramPushObject {
                            constructor(obj) {
                                this._obj = obj;
                                return this;
                            }
                            retire() {
                                this._obj.retire();
                            }
                            exec(aContext) {
                                aContext.stack.push(this._obj.dup());
                            }
                        }
                        instr.MeProgramPushObject = MeProgramPushObject;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramIfThenElse {
                            constructor(testStep, thenStep, elseStep) {
                                this._testStep = testStep;
                                this._thenStep = thenStep;
                                this._elseStep = elseStep;
                            }
                            retire() {
                                this._testStep.retire();
                                this._thenStep.retire();
                                this._elseStep.retire();
                            }
                            exec(aContext) {
                                this._testStep.exec(aContext);
                                let lTest = aContext.stack.popWithType(calclib.scalars.MeFloat);
                                let lTestVal = lTest.value;
                                lTest.retire();
                                if (lTestVal) {
                                    this._thenStep.exec(aContext);
                                }
                                else {
                                    if (this._elseStep) {
                                        this._elseStep.exec(aContext);
                                    }
                                }
                            }
                        }
                        instr.MeProgramIfThenElse = MeProgramIfThenElse;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="MeProgram.ts"/>
/// <reference path="instr/MeProgramBlock.ts"/>
/// <reference path="instr/MeProgramPushObj.ts"/>
/// <reference path="instr/MeProgramIfThenElse.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    const programStartRe = /^<</;
                    const programEndRe = /^>>/;
                    class ProgramParser {
                        static parseBlock(aStr, aTerminatorRe) {
                            const whiteSpaceRe = /^\s*/;
                            const localStoreRe = /^([^= ]+)\=/;
                            const nameListElementRe = /^\s(\S+)/;
                            var lCompiledBlock = [];
                            var lTerminated = false;
                            var lAteLen = 0;
                            var lParseRes;
                            var lObjParseRes;
                            var lReMatch;
                            var lCondBlock;
                            var lThenBlock;
                            var lElseBlock;
                            var lBodyBlock;
                            var lReRes;
                            while (!lTerminated) {
                                // Skip whitespace
                                var lWhiteSpaceMatch = whiteSpaceRe.exec(aStr);
                                if (lWhiteSpaceMatch) {
                                    lAteLen += lWhiteSpaceMatch[0].length;
                                    aStr = aStr.substring(lWhiteSpaceMatch[0].length, aStr.length);
                                }
                                //            alert(aStr);
                                // Is this a terminator?
                                if (lReRes = aTerminatorRe.exec(aStr)) {
                                    lTerminated = true;
                                    lAteLen += lReRes[0].length;
                                }
                                else 
                                // Is this a frame-invoke?
                                if (aStr.substring(0, 2) == "->") {
                                    aStr = aStr.substring(2, aStr.length);
                                    lAteLen += 2;
                                    var lNames = [];
                                    var lStartBlock = false;
                                    while ((lReMatch = nameListElementRe.exec(aStr)) && !lStartBlock) {
                                        lAteLen += lReMatch[0].length;
                                        aStr = aStr.substring(lReMatch[0].length, aStr.length);
                                        if (lReMatch[1] != "<<") {
                                            lNames.push(lReMatch[1]);
                                        }
                                        else {
                                            lStartBlock = true;
                                        }
                                    }
                                    if (!lStartBlock) {
                                        throw new mecalc.core.MeException("Malformed frame invocation; << expected.");
                                    }
                                    lParseRes = ProgramParser.parseBlock(aStr, /^>>/);
                                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                    lAteLen += lParseRes.ateLen;
                                    lCompiledBlock.push(new program.instr.MeInvokeWithFrame(lNames, lParseRes.block));
                                }
                                else 
                                // Is this an 'IF...THEN...ELSE...END' statement?
                                if (aStr.substring(0, 2) == 'IF') {
                                    lParseRes = ProgramParser.parseBlock(aStr.substring(2, aStr.length), /^THEN/);
                                    aStr = aStr.substring(lParseRes.ateLen + 2, aStr.length);
                                    lAteLen += lParseRes.ateLen + 2;
                                    lCondBlock = lParseRes.block;
                                    lParseRes = ProgramParser.parseBlock(aStr, /^((ELSE)|(END))/);
                                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                    lAteLen += lParseRes.ateLen;
                                    lThenBlock = lParseRes.block;
                                    if (lParseRes.terminator == 'ELSE') {
                                        lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                                        aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                        lAteLen += lParseRes.ateLen;
                                        lElseBlock = lParseRes.block;
                                    }
                                    else {
                                        lElseBlock = null;
                                    }
                                    lCompiledBlock.push(new program.instr.MeProgramIfThenElse(lCondBlock, lThenBlock, lElseBlock));
                                }
                                else 
                                // Is this a 'WHILE...DO...END' statement?
                                if (aStr.substring(0, 5) == 'WHILE') {
                                    lParseRes = ProgramParser.parseBlock(aStr.substring(5, aStr.length), /^DO/);
                                    aStr = aStr.substring(lParseRes.ateLen + 5, aStr.length);
                                    lAteLen += lParseRes.ateLen + 5;
                                    lCondBlock = lParseRes.block;
                                    lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                    lAteLen += lParseRes.ateLen;
                                    lBodyBlock = lParseRes.block;
                                    lCompiledBlock.push(new program.instr.MeProgramWhile(lCondBlock, lBodyBlock));
                                }
                                else 
                                // Is this a 'REPEAT...UNTIL...END' statement?
                                if (aStr.substring(0, 6) == 'REPEAT') {
                                    lParseRes = ProgramParser.parseBlock(aStr.substring(6, aStr.length), /^UNTIL/);
                                    aStr = aStr.substring(lParseRes.ateLen + 6, aStr.length);
                                    lAteLen += lParseRes.ateLen + 6;
                                    lBodyBlock = lParseRes.block;
                                    lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                    lAteLen += lParseRes.ateLen;
                                    lCondBlock = lParseRes.block;
                                    lCompiledBlock.push(new program.instr.MeProgramRepeatUntil(lCondBlock, lBodyBlock));
                                }
                                else 
                                // Attempt to parse program step;
                                // Is this a stack object?
                                if (lObjParseRes = mecalc.core.calculator.parser.parseStackObject(aStr)) {
                                    lCompiledBlock.push(new program.instr.MeProgramPushObject(lObjParseRes.obj));
                                    aStr = aStr.substring(lObjParseRes.len, aStr.length);
                                    lAteLen += lObjParseRes.len;
                                }
                                else 
                                // Is this an 'object execute' reference?            
                                if (lObjParseRes = mecalc.core.calculator.parser.parseObjectReference(aStr, true)) {
                                    lCompiledBlock.push(new program.instr.MeProgramExecName(lObjParseRes.resolvedName));
                                    aStr = aStr.substring(lObjParseRes.len, aStr.length);
                                    lAteLen += lObjParseRes.len;
                                }
                                else 
                                // Maybe a local store?
                                if (lReMatch = localStoreRe.exec(aStr)) {
                                    lCompiledBlock.push(new program.instr.MeProgramStoreLocal(lReMatch[1]));
                                    lAteLen += lReMatch[0].length;
                                    aStr = aStr.substring(lReMatch[0].length, aStr.length);
                                }
                                else {
                                    throw new mecalc.core.MeException("Could not parse program: '" + aStr + "'");
                                }
                            }
                            return { 'ateLen': lAteLen, 'block': new program.instr.MeProgramBlock(lCompiledBlock), 'terminator': lReRes[0] };
                        }
                        static parse(aStr) {
                            var lMatchRes = programStartRe.exec(aStr);
                            if (lMatchRes) {
                                var lSourceCode = "<<";
                                var lAteLen = 2;
                                aStr = aStr.substring(2, aStr.length);
                                var lParseRes = ProgramParser.parseBlock(aStr, programEndRe);
                                lSourceCode += aStr.substring(0, lParseRes.ateLen);
                                aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                lAteLen += lParseRes.ateLen;
                                return new mecalc.core.ParserResult(lAteLen, new program.MeProgram(lSourceCode, lParseRes.block));
                            }
                            else {
                                return null;
                            }
                        }
                    }
                    program.ProgramParser = ProgramParser;
                    mecalc.core.calculator.parser.registerParser(ProgramParser.parse);
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeInvokeWithFrame {
                            constructor(locals, body) {
                                this._locals = locals;
                                this._body = body;
                            }
                            retire() {
                                this._body.retire();
                            }
                            exec(aContext) {
                                if (aContext.stack.size() < this._locals.length) {
                                    throw new mecalc.core.MeException("Not enough arguments in stack for frame.");
                                }
                                var lNewCtxt = new mecalc.core.ProgramExecutionContext(aContext, aContext.stack);
                                this._locals.forEach((localName) => {
                                    lNewCtxt.setLocal(localName, aContext.stack.pop(), true);
                                });
                                this._body.exec(lNewCtxt);
                                lNewCtxt.retire();
                            }
                        }
                        instr.MeInvokeWithFrame = MeInvokeWithFrame;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramExecName {
                            constructor(name) {
                                this._name = name;
                                return this;
                            }
                            retire() {
                            }
                            exec(aContext) {
                                var lBoundVal = aContext.getLocal(this._name);
                                if (!lBoundVal) {
                                    var lParseRes = mecalc.core.calculator.parser.parseObjectReference(this._name, false);
                                    if (lParseRes) {
                                        lBoundVal = lParseRes.obj;
                                    }
                                }
                                if (!lBoundVal) {
                                    throw new mecalc.core.MeException("Name " + this._name + " not found.");
                                }
                                lBoundVal.doExec(aContext.stack);
                            }
                        }
                        instr.MeProgramExecName = MeProgramExecName;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramRepeatUntil {
                            constructor(testStep, bodyStep) {
                                this._testStep = testStep;
                                this._bodyStep = bodyStep;
                            }
                            retire() {
                                this._testStep.retire();
                                this._bodyStep.retire();
                            }
                            exec(aContext) {
                                var lTestResVal;
                                do {
                                    this._bodyStep.exec(aContext);
                                    this._testStep.exec(aContext);
                                    let lTestRes = aContext.stack.popWithType(calclib.scalars.MeFloat);
                                    let lTestResVal = lTestRes.value;
                                    lTestRes.retire();
                                } while (!lTestResVal);
                            }
                        }
                        instr.MeProgramRepeatUntil = MeProgramRepeatUntil;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramStoreLocal {
                            constructor(localName) {
                                this._localName = localName;
                            }
                            retire() {
                            }
                            exec(aContext) {
                                let lBoundVal = aContext.stack.pop();
                                if (!aContext.setLocal(this._localName, lBoundVal, false)) {
                                    throw new mecalc.core.MeException("Local " + this._localName + " not found.");
                                }
                            }
                        }
                        instr.MeProgramStoreLocal = MeProgramStoreLocal;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramWhile {
                            constructor(testStep, bodyStep) {
                                this._testStep = testStep;
                                this._bodyStep = bodyStep;
                            }
                            retire() {
                                this._testStep.retire();
                                this._bodyStep.retire();
                            }
                            exec(aContext) {
                                this._testStep.exec(aContext);
                                var lTestRes = aContext.stack.popWithType(calclib.scalars.MeFloat);
                                var lTestResVal = lTestRes.value;
                                lTestRes.retire();
                                while (lTestResVal) {
                                    this._bodyStep.exec(aContext);
                                    this._testStep.exec(aContext);
                                    lTestRes = aContext.stack.popWithType(calclib.scalars.MeFloat);
                                    lTestResVal = lTestRes.value;
                                    lTestRes.retire();
                                }
                            }
                        }
                        instr.MeProgramWhile = MeProgramWhile;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var scalars;
                (function (scalars) {
                    class MeBinaryNumber extends mecalc.core.StackObject {
                        constructor(aNum, aRadix) {
                            super();
                            if (!aRadix) {
                                aRadix = 'd';
                            }
                            this._radix = aRadix;
                            this._value = aNum;
                            return this;
                        }
                        get radix() { return this._radix; }
                        get value() { return this._value; }
                        static sParse(aStr) {
                            const binaryRe = /^\#[ ]*([0-9A-Fa-f]+)[ ]*([dhbo]?)/;
                            var lMatchRes = binaryRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new MeBinaryNumber(parseInt(lMatchRes[1], MeBinaryNumber.radixIdToBase[lMatchRes[2]]), lMatchRes[2]));
                            }
                            else {
                                return null;
                            }
                        }
                        stackDisplayString() {
                            return "#" + this._value.toString(MeBinaryNumber.radixIdToBase[this._radix]) + this._radix;
                        }
                    }
                    MeBinaryNumber.radixIdToBase = {
                        'd': 10,
                        'h': 16,
                        'o': 8,
                        'b': 2
                    };
                    MeBinaryNumber.readableName = "MeBinaryNumber";
                    scalars.MeBinaryNumber = MeBinaryNumber;
                    /////////////////////////////////////////////////////////////////////////////////
                    // Binary number functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function BinAdd(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(a1.value + a2.value, a1.radix));
                    }
                    function BinSub(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(a1.value - a2.value, a1.radix));
                    }
                    function BinMul(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(a1.value * a2.value, a1.radix));
                    }
                    function BinDiv(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(Math.floor(a1.value / a2.value), a1.radix));
                    }
                    function BinMod(aCmd, aStk) {
                        aStk.assertArgTypes([MeBinaryNumber, MeBinaryNumber]);
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(a1.value % a2.value, a1.radix));
                    }
                    function MakeBinBaseChangeFunction(aTargetBase, aTargetBaseName) {
                        return new mecalc.core.JsCommand((aCmd, aStk) => {
                            var lO = aStk.popWithType(MeBinaryNumber);
                            aStk.push(new MeBinaryNumber(lO.value, aTargetBase));
                        }, [MeBinaryNumber], "Change argument's representation base to " + aTargetBaseName + ".");
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // Binary number registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Class
                    mecalc.core.StackObject.registerStackObjectClass(MeBinaryNumber);
                    mecalc.core.calculator.parser.registerParser(MeBinaryNumber.sParse);
                    // Conversions
                    mecalc.core.Conversions.registerConversion(MeBinaryNumber, scalars.MeFloat, (n) => { return new scalars.MeFloat(n.value); });
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinAdd);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinSub);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinMul);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinDiv);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([scalars.MeFloat, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOption([scalars.MeFloat, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOption([scalars.MeFloat, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOption([scalars.MeFloat, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeGreaterThanDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeLessThanDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeGreaterThanEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeLessThanEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        'hex': MakeBinBaseChangeFunction("h", "hexadecimal"),
                        'dec': MakeBinBaseChangeFunction("d", "decimal"),
                        'oct': MakeBinBaseChangeFunction("o", "octal"),
                        'bin': MakeBinBaseChangeFunction("b", "binary"),
                        'mod': new mecalc.core.JsCommand(BinMod, [MeBinaryNumber, MeBinaryNumber], "Calculate the modulus of y divided by x.")
                    });
                })(scalars = calclib.scalars || (calclib.scalars = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var scalars;
                (function (scalars) {
                    /////////////////////////////////////////////////////////////////////////////////
                    // String stack object
                    ////////////////////////////////////////////////////////////////////////////////
                    class MeString extends mecalc.core.StackObject {
                        constructor(aText) {
                            super();
                            this._value = aText;
                        }
                        static sParse(aStr) {
                            const stringRe = /^\"(((\\\")|[^\"])*)\"/;
                            var lMatchRes = stringRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new MeString(lMatchRes[1].replace("\\\"", "\"")));
                            }
                            else {
                                return null;
                            }
                        }
                        get value() { return this._value; }
                        stackDisplayString() {
                            return "\"" + this._value.replace("\"", "\\\"") + "\"";
                        }
                    }
                    MeString.readableName = "MeString";
                    scalars.MeString = MeString;
                    /////////////////////////////////////////////////////////////////////////////////
                    // String functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function StrConcat(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeString);
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new MeString(a1.value + a2.value));
                    }
                    function StrGt(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeString);
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat((a1.value > a2.value) ? 1 : 0));
                    }
                    function StrGte(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeString);
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat((a1.value >= a2.value) ? 1 : 0));
                    }
                    function StrLt(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeString);
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat((a1.value < a2.value) ? 1 : 0));
                    }
                    function StrLte(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeString);
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat((a1.value <= a2.value) ? 1 : 0));
                    }
                    function StrEq(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeString);
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat((a1.value == a2.value) ? 1 : 0));
                    }
                    function StrNeq(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeString);
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat((a1.value != a2.value) ? 1 : 0));
                    }
                    function StrLen(aCmd, aOpt, aStk) {
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat(a1.value.length));
                    }
                    function StrToUpper(aCmd, aStk) {
                        aStk.push(new MeString(aStk.popWithType(MeString).value.toUpperCase()));
                    }
                    function StrToLower(aCmd, aStk) {
                        aStk.push(new MeString(aStk.popWithType(MeString).value.toLowerCase()));
                    }
                    function StrMid(aCmd, aStk) {
                        var lLastIdx = aStk.popWithType(scalars.MeFloat);
                        var lFirstIdx = aStk.popWithType(scalars.MeFloat);
                        var lStr = aStk.popWithType(MeString);
                        aStk.push(new MeString(lStr.value.substring(lFirstIdx.value, lLastIdx.value)));
                    }
                    function StrRepl(aCmd, aStk) {
                        var lRepl = aStk.popWithType(MeString);
                        var lMatch = aStk.popWithType(MeString);
                        var lStr = aStk.popWithType(MeString);
                        aStk.push(new MeString(lStr.value.replace(lMatch.value, lRepl.value)));
                    }
                    function StrFind(aCmd, aStk) {
                        var lMatch = aStk.popWithType(MeString);
                        var lStr = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat(lStr.value.indexOf(lMatch.value)));
                    }
                    function StrRFind(aCmd, aStk) {
                        var lMatch = aStk.popWithType(MeString);
                        var lStr = aStk.popWithType(MeString);
                        aStk.push(new scalars.MeFloat(lStr.value.lastIndexOf(lMatch.value)));
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // String registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Class
                    mecalc.core.StackObject.registerStackObjectClass(MeString);
                    mecalc.core.calculator.parser.registerParser(MeString.sParse);
                    // Conversions
                    mecalc.core.Conversions.registerConversion(scalars.MeFloat, MeString, (n) => new MeString(n.value.toString()));
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([MeString, MeString], StrConcat);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([MeString, scalars.MeFloat], [MeString, MeString]);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([scalars.MeFloat, MeString], [MeString, MeString]);
                    calclib.core_commands.MeGreaterThanDispatch.registerDispatchOption([MeString, MeString], StrGt);
                    calclib.core_commands.MeGreaterThanEqualsDispatch.registerDispatchOption([MeString, MeString], StrGte);
                    calclib.core_commands.MeLessThanDispatch.registerDispatchOption([MeString, MeString], StrLt);
                    calclib.core_commands.MeLessThanEqualsDispatch.registerDispatchOption([MeString, MeString], StrLte);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOption([MeString, MeString], StrEq);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOption([MeString, MeString], StrNeq);
                    calclib.core_commands.MeSizeDispatch.registerDispatchOption([MeString], StrLen);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        'toupper': new mecalc.core.JsCommand(StrToUpper, [MeString], "Convert text in string to upper case", "string"),
                        'tolower': new mecalc.core.JsCommand(StrToLower, [MeString], "Convert text in string to lower case", "string"),
                        'mid': new mecalc.core.JsCommand(StrMid, [MeString, scalars.MeFloat, scalars.MeFloat], "Return substring of z, from index y to index x, exclusive", "string"),
                        'repl': new mecalc.core.JsCommand(StrRepl, [MeString, MeString, MeString], "Return z, with substring y relaced by x", "string"),
                        'find': new mecalc.core.JsCommand(StrFind, [MeString, MeString], "Return index of first occurence of x within y, -1 if not found", "string"),
                        'rfind': new mecalc.core.JsCommand(StrRFind, [MeString, MeString], "Return index of last occurence of x within y, -1 if not found", "string")
                    });
                })(scalars = calclib.scalars || (calclib.scalars = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
///<reference path="CalculatorStack.ts"/>
///<reference path="StackObject.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class ProgramExecutionContext {
                    constructor(aParentContext, aStack) {
                        this._parent = aParentContext;
                        this._stack = aStack;
                        this._locals = {};
                    }
                    get stack() {
                        return this._stack;
                    }
                    getLocal(aName) {
                        var ctxt = this;
                        while (ctxt) {
                            if (aName in ctxt._locals) {
                                return ctxt._locals[aName];
                            }
                            ctxt = ctxt._parent;
                        }
                    }
                    setLocal(aName, aValue, aCreate) {
                        var ctxt = this;
                        while (ctxt) {
                            if (aName in ctxt._locals) {
                                if (ctxt._locals[aName]) {
                                    ctxt._locals[aName].retire();
                                }
                                ctxt._locals[aName] = aValue;
                                return true;
                            }
                            ctxt = ctxt._parent;
                        }
                        if (aCreate) {
                            this._locals[aName] = aValue;
                            return true;
                        }
                        return false;
                    }
                    retire() {
                        var lName;
                        for (lName in this._locals) {
                            let loc = this._locals[lName];
                            if (loc) {
                                loc.retire();
                                delete this._locals[lName];
                            }
                        }
                    }
                }
                core.ProgramExecutionContext = ProgramExecutionContext;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class XmlArchive extends core.ObjectArchive {
                    constructor(aOwnerDoc, aOwnerElem) {
                        super();
                        this._ownerDoc = aOwnerDoc;
                        this._currentContainer = aOwnerElem;
                        if (!this._currentContainer) {
                            this._currentContainer = this._ownerDoc.createElement('archive');
                            this._ownerDoc.appendChild(this._currentContainer);
                        }
                        this._currentElement = this._currentContainer.firstChild;
                    }
                    writeContainerStart(aName) {
                        var lElem = this._currentContainer.ownerDocument.createElement(aName);
                        this._currentContainer.appendChild(lElem);
                        this._currentContainer = lElem;
                    }
                    writeContainerEnd() {
                        if (this._currentContainer.parentNode instanceof Element) {
                            this._currentContainer = this._currentContainer.parentNode;
                        }
                        else {
                            throw new core.MeException("Can't writeContainerEnd without a container.");
                        }
                    }
                    writeProperty(aPropName, aVal) {
                        var lElem = this._currentContainer.ownerDocument.createElement(aPropName);
                        this._currentContainer.appendChild(lElem);
                        lElem.setAttribute('type', typeof (aVal));
                        var lVal = this._currentContainer.ownerDocument.createTextNode(aVal);
                        lElem.appendChild(lVal);
                    }
                    writeObject(aTag, aVal) {
                        this.writeContainerStart(aTag);
                        this._writeObjectToElement(this._currentContainer, aVal);
                        this.writeContainerEnd();
                    }
                    readProperty(expectedName) {
                        var lPropName = this._currentElement.nodeName;
                        var lPropVal = this._currentElement.firstChild.nodeValue;
                        this._currentElement = this._currentElement.nextSibling;
                        return { 'name': lPropName, 'value': lPropVal };
                    }
                    readContainerStart(expectedTag) {
                        var lContainerTag = this._currentElement.nodeName;
                        if (this._currentElement instanceof Element) {
                            this._currentContainer = this._currentElement;
                            this._currentElement = this._currentContainer.firstChild;
                        }
                        else {
                            throw new core.MeException("Container expected but not found.");
                        }
                        return { 'tag': lContainerTag };
                    }
                    containerHasMoreData() {
                        return this._currentElement !== null;
                    }
                    readContainerEnd() {
                        if (this._currentContainer.parentNode instanceof Element) {
                            this._currentElement = this._currentContainer.nextSibling;
                            this._currentContainer = this._currentContainer.parentNode;
                        }
                        else {
                            throw new core.MeException("Container end expected but not found.");
                        }
                    }
                    readObject(expectedTag) {
                        var lTag = this.readContainerStart(expectedTag);
                        var lObj = this._readObjectFromElement(this._currentContainer);
                        this.readContainerEnd();
                        return { 'tag': lTag, 'value': lObj };
                    }
                    _writeObjectToElement(aElem, aVal) {
                        aElem.setAttribute('type', aVal.constructor.name);
                        aVal.archiveStore(this);
                    }
                    _readObjectFromElement(aElem) {
                        var lClassName = aElem.getAttribute('type');
                        var lObj = new (core.SerializableObject.getClass(lClassName))();
                        lObj.archiveLoad(this);
                        return lObj;
                    }
                }
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
