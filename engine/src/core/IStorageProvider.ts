namespace org.eldanb.mecalc.core {
    export interface IStorageProvider {
        ensureDirectory(directoryPath : string) : Promise<boolean>;
        saveFile(filePath : string, fileContent : string) : Promise<boolean>;
        loadFile(filePath : string) : Promise<string>;
        enumDirectory(dirPath : string) : Promise<Array<string>>;
        isFile(filePath : string) : Promise<boolean>;
        deleteFile(FilePath : string) : Promise<boolean>;
        deleteDirectory(FilePath : string) : Promise<boolean>;
    }
}