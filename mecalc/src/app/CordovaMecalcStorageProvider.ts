///<reference path="../../plugins/cordova-plugin-file/types/index.d.ts"/>

declare var cordova: any;

export class CordovaMecalcStorageProvider implements org.eldanb.mecalc.core.IStorageProvider {
    
    ensureDirectory(directoryPath: string): Promise<boolean> {
        return this.getFilesystem().then((fs) => {
            return this.resolveFileSystemPath(".").then((parentPath) => {                
                let p = new Promise<boolean>((accept, reject) => {
                    let folders = (parentPath + "/" + directoryPath).split("/");
                    let createNextEntry = (entry : DirectoryEntry) => {
                        if(folders.length) {
                            entry.getDirectory(folders.shift(), {create : true}, createNextEntry, reject);
                        } else {
                            accept(true);
                        }
                    }

                    createNextEntry(fs.root);
                });

                return p;
            })
        }).catch((err) => {            
            throw err;
        });;        
    }    
    
    
    saveFile(filePath: string, fileContent: string): Promise<boolean> {
        return new Promise<boolean>((accept, reject) => {
            this.getFilesystem().then((fs) => {
                return this.resolveFileSystemPath(filePath).then((resolvedPath) => {
                    fs.root.getFile(resolvedPath, {create: true}, (entry : FileEntry) => {
                        entry.createWriter((writer) => {
                            writer.truncate(0);
                            writer.onwriteend = (e) => {
                                accept(true);
                            };
                            writer.onerror = reject;
                            writer.onabort = reject;                            
                            writer.write(new Blob([fileContent]));
                        }, reject)
                    }, reject)
                })
            }).catch(reject);
        }).catch((err) => {            
            throw err;
        });        
    }

    deleteFile(filePath: string): Promise<boolean> {
        return new Promise<boolean>((accept, reject) => {
            this.getFilesystem().then((fs) => {
                return this.resolveFileSystemPath(filePath).then((entryPath) => {
                    fs.root.getFile(entryPath, null, 
                        (fileEntry) => {
                            fileEntry.remove(accept, reject);
                            accept(true);
                        },

                        reject)
                });
            }).catch(reject);
        }).catch((err) => {            
            throw err;
        });
    }

    deleteDirectory(filePath : string) : Promise<boolean> {
        return new Promise<boolean>((accept, reject) => {
            this.getFilesystem().then((fs) => {
                return this.resolveFileSystemPath(filePath).then((entryPath) => {
                    fs.root.getDirectory(entryPath, null, 
                        (dirEntry) => {
                            dirEntry.removeRecursively(accept, reject);
                            accept(true);
                        },

                        reject)
                });
            }).catch(reject);
        }).catch((err) => {            
            throw err;
        });
    }

    loadFile(filePath: string): Promise<string> {
        return new Promise<string>((accept, reject) => {
            this.getFilesystem().then((fs) => {
                return this.resolveFileSystemPath(filePath).then((resolvedPath) => {
                    fs.root.getFile(resolvedPath, {create: false}, (entry : FileEntry) => {
                        entry.file((file) => {
                            let reader = new FileReader();
                            reader.onloadend = () => {
                                accept(reader.result as string);
                            }
                            reader.onerror = reject;
                            reader.onabort = reject;

                            reader.readAsText(file);
                        }, reject)
                    }, reject)
                })
            }).catch(reject);
        }).catch((err) => {            
            throw err;
        }); 
    }

    enumDirectory(dirPath: string): Promise<string[]> {
        return new Promise<string[]>((accept, reject) => {
            this.getFilesystem().then((fs) => {
                return this.resolveFileSystemPath(dirPath).then((resolvedPath) => {
                    //alert('will get dir');
                    fs.root.getDirectory(resolvedPath, {create: false}, (entry : DirectoryEntry) => {
                      //  alert('will read');
                        let reader = entry.createReader();
                        
                        reader.readEntries((entries) => {
                        //    alert('got entries ' + entries);
                            accept(entries.map((e) => e.name));
                        }, reject);
                    }, reject)
                })
            }).catch(reject);
        }).catch((err) => {            
            throw err;
        }); 
    }

    isFile(filePath: string): Promise<boolean> {
        return new Promise<boolean>((accept, reject) => {
            this.getFilesystem().then((fs) => {
                return this.resolveFileSystemPath(filePath).then((resolvedPath) => {
                    fs.root.getFile(resolvedPath, {create: false}, (entry : FileEntry) => {
                        accept(true) 
                    }, () => {
                        accept(false);
                    })
                })
            }).catch(reject);
        }).catch((err) => {
            throw err;
        }); 
    }

    private resolveFileSystemPath(fsPath : string) : Promise<string> {
        return new Promise((accept, reject) => {            
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, 
                    (entry) => {
                        accept(entry.fullPath + fsPath);
                    }, reject);
        });
    }


    private getFilesystem() : Promise<FileSystem> {
        return new Promise((accept, reject) => {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, accept, reject);
        });
    }
                
}