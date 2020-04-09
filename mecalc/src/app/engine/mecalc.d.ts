declare namespace org.eldanb.mecalc.core {
    class SerializedJson {
        data: any;
    }
    interface SerializationFormat {
        toJson(o: object): object;
        fromJson(o: object): object;
    }
    class AutomaticSerializationFormat<T extends object> implements SerializationFormat {
        private _ctorArgs;
        private _ctor;
        constructor(ctor: new (...args: Array<any>) => T, ...ctorArgsToAttrs: Array<string>);
        private valueToJson(v);
        private valueFromJson(v);
        toJson(o: object): object;
        fromJson(o: object): T;
    }
    interface SerializableObjectCtor {
        new (...m: Array<any>): object;
        name: string;
        format: SerializationFormat;
    }
    class ObjectSerialization {
        static fromJson<T extends object>(jsonVal: object): T;
        static toJson(obj: object): object;
        static registerSerializableClass(klass: SerializableObjectCtor): void;
        static getFormatter(name: string): SerializationFormat;
    }
}
declare namespace org.eldanb.mecalc.core {
    interface StackObjectCtor {
        readableName: string;
        new (...m: Array<any>): StackObject;
    }
    class StackObject {
        static registerStackObjectClass(klass: StackObjectCtor): void;
        static registerSerializableStackObjectClass(klass: StackObjectCtor & SerializableObjectCtor): void;
        unparse(): string;
        doExec(aStk: ICalculatorStack): Promise<void>;
        stackDisplayString(): string;
        retire(): void;
        dup(): StackObject;
    }
    abstract class RefCountedStackObject extends StackObject {
        _refCount: number;
        dup(): StackObject;
        protected readonly refCount: number;
        retire(): void;
        abstract retiringLastRef(): void;
    }
}
declare namespace org.eldanb.mecalc.core {
    type JsCommandFunction = ((cmd: JsCommand, stack: ICalculatorStack) => void) | ((cmd: JsCommand, stack: ICalculatorStack) => Promise<void>);
    class JsCommand extends StackObject {
        static readableName: string;
        _precondition: Array<StackPrecondition>;
        _fn: JsCommandFunction;
        _docString: string;
        _tags: string;
        constructor(aFn?: JsCommandFunction, aPrecondition?: Array<StackPrecondition>, aDocString?: string, aTags?: string);
        stackDisplayString(): string;
        doExec(aStk: ICalculatorStack): Promise<void>;
        getDocXml(aParentElement: any): any;
    }
}
declare namespace org.eldanb.mecalc.core {
    type DispatchOptionFn = (sender: DispatchedCommand, opt: DispatchOption, stack: ICalculatorStack) => void;
    interface DispatchOption {
        precondition: Array<StackPrecondition>;
        fn: DispatchOptionFn;
        directFn: Function | null;
    }
    class DispatchedCommand extends StackObject {
        _dispatchOptions: Array<DispatchOption>;
        _tags: string;
        _docString: string;
        static readableName: string;
        constructor(aDocString: string, aTags: string);
        stackDisplayString(): string;
        doExec(aStk: ICalculatorStack): Promise<void>;
        directApply(...args: Array<StackObject>): StackObject;
        registerDispatchOptionInternal(aPrecondition: Array<StackPrecondition>, aFnOrConversion: ((...args: Array<StackObject>) => StackObject) | DispatchOptionFn | Array<Function>, aStackFn: boolean): void;
        registerDispatchOption(aPrecondition: Array<StackPrecondition>, aFnOrConversion: DispatchOptionFn | Array<Function>): void;
        registerDispatchOptionFn(aPrecondition: Array<StackPrecondition>, aFnOrConversion: ((...args: Array<StackObject>) => StackObject) | Array<Function>): void;
        getDocXml(aParentElement: any): any;
    }
    class Conversions {
        private static typeIdSeed;
        static registerConversion<S, T>(aSrc: {
            new (...a: Array<any>): S;
        }, aTarget: {
            new (...a: Array<any>): T;
        }, aConverter: (o: S) => T): void;
        static convert(aSrc: StackObject, aType: Function): StackObject;
        static getConverter(aSrcType: StackPrecondition, aType: Function): any;
    }
}
declare namespace org.eldanb.mecalc.core {
    class ParserResult {
        _len: number;
        _parsedObject: StackObject;
        _isBuiltin?: boolean;
        _resolvedName?: string;
        readonly len: number;
        readonly obj: StackObject;
        readonly isBuiltin: boolean;
        readonly resolvedName: string;
        constructor(len: number, obj: StackObject, isBuiltin?: boolean, resolvedName?: string);
    }
    type ParserFn = (text: string) => (ParserResult | null);
    class Parser {
        _owner: MeCalculator;
        _parserList: Array<ParserFn>;
        constructor(aOwner: MeCalculator);
        registerParser(aParser: ParserFn): void;
        parseStackObject(aStr: string): ParserResult | null;
        parseObjectName(aStr: string): ParserResult | null;
        parseObjectReference(aStr: string): Promise<ParserResult | null>;
    }
}
declare namespace org.eldanb.mecalc.core {
    class MeException {
        _message: string;
        constructor(message: string);
        toString(): string;
    }
}
declare namespace org.eldanb.mecalc.core {
    class AutoRetireCalculatorStack implements ICalculatorStack {
        private _delegate;
        private _retiredObjects;
        constructor(aStk: ICalculatorStack);
        pop(): StackObject;
        popWithType<T>(tp: {
            new (...a: Array<any>): T;
        }): T;
        dropAt(aIdx: number): StackObject;
        popNoRetire(): void;
        popMultiple(aCount: number): Array<StackObject>;
        clear(): void;
        retireObjects(): void;
        item(aIdx: number): StackObject;
        size(): number;
        addListener(aListener: StackListener): void;
        removeListener(aListener: StackListener): void;
        push(aObj: StackObject): void;
        pushMultiple(aPushWho: StackObject[]): void;
        checkValidity(aPrecondition: StackPrecondition[]): boolean;
        assertArgTypes(aPrecondition: StackPrecondition[]): void;
    }
}
declare namespace org.eldanb.mecalc.core {
    interface StackListener {
        stackUpdateSplice(aSender: CalculatorStack, aStart: number, aLen: number, aNewVals: Array<StackObject> | null): any;
    }
    abstract class StackPreconditionTest {
        abstract evaluate(aObj: StackObject): boolean;
    }
    type StackPrecondition = string | StackObjectCtor | StackPreconditionTest;
    interface ICalculatorStack {
        item(aIdx: number): StackObject;
        size(): number;
        addListener(aListener: StackListener): void;
        removeListener(aListener: StackListener): void;
        push(aObj: StackObject): void;
        pushMultiple(aPushWho: Array<StackObject>): void;
        pop(): StackObject;
        popWithType<T>(tp: {
            new (...a: Array<any>): T;
        }): T;
        popMultiple(aCount: number): Array<StackObject>;
        dropAt(aAt: number): StackObject;
        clear(): void;
        checkValidity(aPrecondition: Array<StackPrecondition>): boolean;
        assertArgTypes(aPrecondition: Array<StackPrecondition>): void;
    }
}
declare namespace org.eldanb.mecalc.core {
    class CalculatorStack implements ICalculatorStack {
        _values: Array<StackObject>;
        _listeners: Array<StackListener>;
        constructor();
        item(aIdx: number): StackObject;
        size(): number;
        addListener(aListener: StackListener): void;
        removeListener(aListener: StackListener): void;
        push(aObj: StackObject): void;
        pushMultiple(aPushWho: Array<StackObject>): void;
        pop(): StackObject;
        popWithType<T>(tp: {
            new (...a: Array<any>): T;
        }): T;
        popMultiple(aCount: number): Array<StackObject>;
        dropAt(aAt: number): StackObject;
        clear(): void;
        private _notifySpliceChange(aStart, aLen, aNewVals);
        static preconditionComponentToString(aComponent: StackPrecondition): string;
        private _preconditionArrayToString(aPreCond);
        static checkPreconditionComponent(aPrecond: StackPrecondition, aArg: StackObject): boolean;
        checkValidity(aPrecondition: Array<StackPrecondition>): boolean;
        assertArgTypes(aPrecondition: Array<StackPrecondition>): void;
    }
}
declare namespace org.eldanb.mecalc.calclib.filesys {
}
declare namespace org.eldanb.mecalc.core {
    interface BuiltinMap {
        [builtinName: string]: StackObject;
    }
    interface MeCalculatorListener {
        notifyChangeDir(sender: MeCalculator, directory: StackObject): any;
    }
    class MeCalculator {
        private _busyPromise;
        private _parser;
        private _stack;
        private _homeDir;
        private _curDir;
        private _builtins;
        private _execCtxt;
        private _listeners;
        storageProvider: IStorageProvider;
        constructor();
        readonly stack: CalculatorStack;
        readonly parser: Parser;
        readonly currentDir: calclib.filesys.Directory;
        readonly homeDir: calclib.filesys.Directory;
        getProgExecContext(): ProgramExecutionContext;
        pushExecContext(aCtxt: ProgramExecutionContext): void;
        popExecContext(): ProgramExecutionContext;
        execObject(obj: core.StackObject): Promise<void>;
        processCommandLine(aCmd: string): Promise<void>;
        private enqueueOnBusyQueue(what);
        registerBuiltins(aBuiltins: BuiltinMap): void;
        getBuiltin(aName: string): StackObject | null;
        changeDir(aDir: calclib.filesys.Directory): void;
        loadHomeDirectory(aDir: calclib.filesys.Directory): void;
        init(aHomeDir: calclib.filesys.Directory): void;
        addListener(aListener: MeCalculatorListener): void;
    }
    var calculator: MeCalculator;
}
declare namespace org.eldanb.mecalc.calclib.core_commands {
    var MePlusDispatch: core.DispatchedCommand;
    var MeMinusDispatch: core.DispatchedCommand;
    var MeTimesDispatch: core.DispatchedCommand;
    var MeDivideDispatch: core.DispatchedCommand;
    var MeNegateDispatch: core.DispatchedCommand;
    var MeInverseDispatch: core.DispatchedCommand;
    var MeExpDispatch: core.DispatchedCommand;
    var MeSqrtDispatch: core.DispatchedCommand;
    var MeAbsDispatch: core.DispatchedCommand;
    var MeLnDispatch: core.DispatchedCommand;
    var MeLogDispatch: core.DispatchedCommand;
    var MePowDispatch: core.DispatchedCommand;
    var MeSqrDispatch: core.DispatchedCommand;
    var MeSinDispatch: core.DispatchedCommand;
    var MeCosDispatch: core.DispatchedCommand;
    var MeTanDispatch: core.DispatchedCommand;
    var MeArcSinDispatch: core.DispatchedCommand;
    var MeArcTanDispatch: core.DispatchedCommand;
    var MeArcCosDispatch: core.DispatchedCommand;
    var MeFloorDispatch: core.DispatchedCommand;
    var MeCeilDispatch: core.DispatchedCommand;
    var MeRandDispatch: core.DispatchedCommand;
    var MeGreaterThanDispatch: core.DispatchedCommand;
    var MeLessThanDispatch: core.DispatchedCommand;
    var MeGreaterThanEqualsDispatch: core.DispatchedCommand;
    var MeLessThanEqualsDispatch: core.DispatchedCommand;
    var MeEqualsDispatch: core.DispatchedCommand;
    var MeNotEqualsDispatch: core.DispatchedCommand;
    var MeConjDispatch: core.DispatchedCommand;
    interface DispatcherCategory {
        [name: string]: core.DispatchedCommand;
    }
    var MeCoreElementaryFunctions: DispatcherCategory;
}
declare namespace org.eldanb.mecalc.calclib.scalars {
    class MeFloat extends core.StackObject {
        static readableName: string;
        _value: number;
        constructor(aNum: number);
        static format: core.SerializationFormat;
        static sParse(aStr: string): core.ParserResult;
        readonly value: number;
        stackDisplayString(): string;
        conj(): MeFloat;
        neq(aOp: MeFloat): boolean;
        eq(aOp: MeFloat): boolean;
    }
    function EnsureNumeric(aVal: number): number;
}
declare namespace org.eldanb.mecalc.calclib.core_commands {
}
declare namespace org.eldanb.mecalc.calclib.boolean_commands {
}
declare namespace org.eldanb.mecalc.calclib {
    class StackObjectSequence extends core.RefCountedStackObject {
        static readableName: string;
        put(idx: number, value: core.StackObject): void;
        get(idx: number): core.StackObject;
        mid(start: number, end: number): StackObjectSequence;
        find(who: core.StackObject): scalars.MeFloat;
        rfind(who: core.StackObject): scalars.MeFloat;
        size(): number;
        swapForWritable(): StackObjectSequence;
        retiringLastRef(): void;
        constructor();
    }
}
declare namespace org.eldanb.mecalc.calclib {
    class MeList extends StackObjectSequence {
        static readableName: string;
        _valuesList: Array<core.StackObject>;
        constructor(aList: Array<core.StackObject>);
        readonly valuesList: Array<core.StackObject>;
        static sParse(aStr: string): core.ParserResult;
        stackDisplayString(): string;
        get(aIdx: number): core.StackObject;
        put(aIdx: number, aValue: core.StackObject): void;
        size(): number;
        retiringLastRef(): void;
        mid(start: number, end: number): StackObjectSequence;
        find(who: core.StackObject): scalars.MeFloat;
        rfind(who: core.StackObject): scalars.MeFloat;
        sort(): MeList;
        reverse(): MeList;
        swapForWritable(): MeList;
        static format: core.SerializationFormat;
    }
}
declare namespace org.eldanb.mecalc.calclib.scalars {
    class MeComplex extends core.StackObject {
        static readableName: string;
        _realVal: number;
        _imageVal: number;
        constructor(aReal?: number, aImag?: number);
        readonly realVal: number;
        readonly imageVal: number;
        static sParse(aStr: string): core.ParserResult;
        stackDisplayString(): string;
        unparse(): string;
        arg(): number;
        abs(): number;
        pow(aExpo: MeComplex): MeComplex;
        sqrt(): MeComplex;
        exp(): MeComplex;
        ln(): MeComplex;
        conj(): MeComplex;
        eq(aOp: core.StackObject): boolean;
        neq(aOp: core.StackObject): boolean;
        static format: core.SerializationFormat;
    }
}
declare namespace org.eldanb.mecalc.calclib.filesys {
    class Symbol extends core.StackObject {
        static readableName: string;
        _name: string;
        constructor(aSymName: string);
        static sParse(aStr: string): core.ParserResult | null;
        stackDisplayString(): string;
        readonly name: string;
        static format: core.SerializationFormat;
    }
}
declare namespace org.eldanb.mecalc.calclib.expr {
    abstract class MeExprNode {
        _refCount: number;
        construtor(): void;
        abstract eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject>;
        abstract unparse(): string;
        abstract derive(bySymbol: filesys.Symbol): MeExprNode;
        dup(): MeExprNode;
        retire(): void;
        onLastRefRetire(): void;
    }
    class MeExpr extends core.RefCountedStackObject {
        _rootNode: MeExprNode;
        static readableName: string;
        constructor(aRootNode: MeExprNode);
        doExec(aStk: core.CalculatorStack): Promise<void>;
        static format: core.SerializationFormat;
        retiringLastRef(): void;
        stackDisplayString(): string;
        derive(bySym: filesys.Symbol): MeExpr;
    }
}
declare namespace org.eldanb.mecalc.calclib.expr {
    class ExpressionParser {
        private static parseBinaryOp(opRegex, nextParser, parseCtx);
        private static parseParen(parseCtx);
        private static parseObject(parseCtx);
        private static parseSymbol(parseCtx);
        private static parseFnInvoke(parseCtx);
        private static parsePrimary(parseCtx);
        private static parseMulDiv(parseCtx);
        private static parseAddSub(parseCtx);
        static parse(aStr: string): core.ParserResult;
    }
}
declare namespace org.eldanb.mecalc.calclib.expr.nodes {
    const OpNamesToDispatchers: {
        [index: string]: {
            cmd: core.DispatchedCommand;
            level: number;
        };
    };
    class MeExprNodeBinaryOp extends MeExprNode {
        _operatorName: string;
        _leftOperand: MeExprNode;
        _rightOperand: MeExprNode;
        constructor(operator: string, leftOperand: MeExprNode, rightOperand: MeExprNode);
        isZero(n: MeExprNode): boolean;
        isUnit(n: MeExprNode): boolean;
        simplifyConstants(): MeExprNode;
        derive(bySymbol: filesys.Symbol): MeExprNode;
        onLastRefRetire(): void;
        eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject>;
        unparse(): string;
    }
}
declare namespace org.eldanb.mecalc.calclib.expr.nodes {
    class MeExprNodeStackObject extends MeExprNode {
        protected _stackObject: core.StackObject;
        constructor(stackObject: core.StackObject);
        readonly stackObject: core.StackObject;
        eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject>;
        derive(bySymbol: filesys.Symbol): MeExprNode;
        onLastRefRetire(): void;
        unparse(): string;
    }
}
declare namespace org.eldanb.mecalc.calclib.expr.nodes {
    class MeExprNodeFnInvoke extends MeExprNode {
        _fnName: string;
        _operands: Array<MeExprNode>;
        constructor(fnName: string, args: Array<MeExprNode>);
        onLastRefRetire(): void;
        eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject>;
        derive(bySymbol: filesys.Symbol): MeExprNode;
        unparse(): string;
    }
}
declare namespace org.eldanb.mecalc.calclib.expr.nodes {
    class MeExprNodeSymbol extends MeExprNodeStackObject {
        constructor(sym: calclib.filesys.Symbol);
        readonly symbol: calclib.filesys.Symbol;
        unparse(): string;
        derive(bySymbol: filesys.Symbol): MeExprNode;
        eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject>;
    }
}
declare namespace org.eldanb.mecalc.core {
    interface IStorageProvider {
        ensureDirectory(directoryPath: string): Promise<boolean>;
        saveFile(filePath: string, fileContent: string): Promise<boolean>;
        loadFile(filePath: string): Promise<string>;
        enumDirectory(dirPath: string): Promise<Array<string>>;
        isFile(filePath: string): Promise<boolean>;
        deleteFile(FilePath: string): Promise<boolean>;
        deleteDirectory(FilePath: string): Promise<boolean>;
    }
}
declare namespace org.eldanb.mecalc.calclib.filesys {
    class ChDirPseudoCommand extends core.StackObject {
        _dir: Directory;
        constructor(toDir: Directory);
        doExec(aStk: core.ICalculatorStack): Promise<void>;
    }
    class Directory extends core.StackObject {
        private _name;
        private _parent;
        private _contents;
        private _storageProvider;
        static readableName: string;
        constructor(name?: string, parent?: Directory, storageProvider?: core.IStorageProvider);
        stackDisplayString(): string;
        readonly parent: Directory | null;
        readonly name: string;
        readonly itemNames: Array<string>;
        store(aSym: Symbol, aObj: core.StackObject): Promise<void>;
        recall(aSym: Symbol): Promise<core.StackObject>;
        getByString(aStr: string): Promise<core.StackObject>;
        syncGetByName(aStr: string): core.StackObject;
        purge(aSym: Symbol): Promise<void>;
        dup(): core.StackObject;
        retire(): void;
        private reparent(newParent);
        private storeAll();
        private pathForSymbol(symbolName);
        private storeSymbol(symbolName, storedObj);
        private ensureSymbolLoaded(symbolName);
        loadIndexFromStorage(): Promise<void>;
        private purgeSymbol(symbolName, symbolObj);
        private readonly storagePath;
    }
}
declare namespace org.eldanb.mecalc.calclib.filesys {
}
declare namespace org.eldanb.mecalc.calclib.linear {
    class MeVector extends StackObjectSequence {
        static readableName: string;
        _valuesVector: Array<core.StackObject>;
        constructor(aVec: Array<core.StackObject>);
        readonly valuesVector: Array<core.StackObject>;
        static sParseVectorValues(aStr: string): Array<core.StackObject> | null;
        static sParse(aStr: string): core.ParserResult;
        stackDisplayString(): string;
        get(aIdx: number): core.StackObject;
        put(aIdx: number, aValue: core.StackObject): void;
        size(): number;
        mid(start: number, end: number): StackObjectSequence;
        find(who: core.StackObject): scalars.MeFloat;
        rfind(who: core.StackObject): scalars.MeFloat;
        retiringLastRef(): void;
        swapForWritable(): MeVector;
        static format: core.SerializationFormat;
    }
}
declare namespace org.eldanb.mecalc.calclib.program {
    interface MeProgramStep {
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
        retire(): void;
    }
    class MeProgram extends core.RefCountedStackObject {
        _sourceCode: string;
        _compiledProgramBlock: MeProgramStep;
        static readableName: string;
        constructor(aSrc?: string, aCompiledProgramBlock?: MeProgramStep);
        doExec(aStk: core.CalculatorStack): Promise<void>;
        static format: core.SerializationFormat;
        retiringLastRef(): void;
        stackDisplayString(): string;
    }
}
declare namespace org.eldanb.mecalc.calclib.program.instr {
    class MeProgramBlock implements MeProgramStep {
        _steps: Array<MeProgramStep>;
        constructor(aSteps: Array<MeProgramStep>);
        retire(): void;
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
    }
}
declare namespace org.eldanb.mecalc.calclib.program.instr {
    class MeProgramPushObject implements MeProgramStep {
        _obj: core.StackObject;
        constructor(obj: core.StackObject);
        retire(): void;
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
    }
}
declare namespace org.eldanb.mecalc.calclib.program.instr {
    class MeProgramIfThenElse implements MeProgramStep {
        _testStep: MeProgramStep;
        _thenStep: MeProgramStep;
        _elseStep: MeProgramStep;
        constructor(testStep: MeProgramStep, thenStep: MeProgramStep, elseStep: MeProgramStep);
        retire(): void;
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
    }
}
declare namespace org.eldanb.mecalc.calclib.program {
    class ProgramParser {
        private static parseBlock(aStr, aTerminatorRe);
        static parse(aStr: string): core.ParserResult;
    }
}
declare namespace org.eldanb.mecalc.calclib.program.instr {
    class MeInvokeWithFrame implements MeProgramStep {
        _locals: Array<string>;
        _body: MeProgramStep;
        constructor(locals: Array<string>, body: MeProgramStep);
        retire(): void;
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
    }
}
declare namespace org.eldanb.mecalc.calclib.program.instr {
    class MeProgramExecName implements MeProgramStep {
        _name: string;
        constructor(name: string);
        retire(): void;
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
    }
}
declare namespace org.eldanb.mecalc.calclib.program.instr {
    class MeProgramRepeatUntil implements MeProgramStep {
        _testStep: MeProgramStep;
        _bodyStep: MeProgramStep;
        constructor(testStep: MeProgramStep, bodyStep: MeProgramStep);
        retire(): void;
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
    }
}
declare namespace org.eldanb.mecalc.calclib.program.instr {
    class MeProgramStoreLocal implements MeProgramStep {
        _localName: string;
        constructor(localName: string);
        retire(): void;
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
    }
}
declare namespace org.eldanb.mecalc.calclib.program.instr {
    class MeProgramWhile implements MeProgramStep {
        _testStep: MeProgramStep;
        _bodyStep: MeProgramStep;
        constructor(testStep: MeProgramStep, bodyStep: MeProgramStep);
        retire(): void;
        exec(aContext: core.ProgramExecutionContext): Promise<void>;
    }
}
declare namespace org.eldanb.mecalc.calclib.scalars {
    class MeBinaryNumber extends core.StackObject {
        static radixIdToBase: {
            'd': number;
            'h': number;
            'o': number;
            'b': number;
        };
        static readableName: string;
        _radix: string;
        _value: number;
        readonly radix: string;
        readonly value: number;
        constructor(aNum?: number, aRadix?: string);
        static sParse(aStr: string): core.ParserResult;
        stackDisplayString(): string;
        static format: core.SerializationFormat;
    }
}
declare namespace org.eldanb.mecalc.calclib.scalars {
    class MeString extends StackObjectSequence {
        static readableName: string;
        _value: string;
        constructor(aText: string);
        static sParse(aStr: string): core.ParserResult | null;
        static format: core.SerializationFormat;
        readonly value: string;
        size(): number;
        get(idx: number): core.StackObject;
        put(idx: number, o: core.StackObject): void;
        mid(start: number, end: number): StackObjectSequence;
        find(who: core.StackObject): MeFloat;
        rfind(who: core.StackObject): MeFloat;
        swapForWritable(): MeString;
        stackDisplayString(): string;
    }
}
declare namespace org.eldanb.mecalc.core {
    class ProgramExecutionContext {
        private _parent;
        private _stack;
        private _locals;
        constructor(aParentContext: ProgramExecutionContext, aStack: CalculatorStack);
        readonly stack: CalculatorStack;
        getLocal(aName: string): StackObject;
        setLocal(aName: string, aValue: StackObject, aCreate: boolean): boolean;
        retire(): void;
    }
}
