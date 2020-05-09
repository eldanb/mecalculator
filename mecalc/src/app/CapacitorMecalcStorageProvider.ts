
import { Plugins, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
const { Filesystem } = Plugins;

declare var cordova: any;

export class CapacitorMecalcStorageProvider implements org.eldanb.mecalc.core.IStorageProvider {

    async ensureDirectory(directoryPath: string): Promise<boolean> {
        let fstat; 
        try {
            fstat = await Filesystem.stat({
                directory: FilesystemDirectory.Data,
                path: directoryPath
            });
        } catch(e) {
            await Filesystem.mkdir({
                path: `${directoryPath}`,
                directory: FilesystemDirectory.Data,
                recursive: true
            });

            return true;
        }

        if (['NSFileTypeDirectory', 'directory'].indexOf(fstat.type) < 0) {
            throw Error(`${directoryPath} is not a directory`);
        }

        return true;

    }

    saveFile(filePath: string, fileContent: string): Promise<boolean> {
        return Filesystem.writeFile({
            directory: FilesystemDirectory.Data,
            path: filePath,
            encoding: FilesystemEncoding.UTF8,
            data: fileContent
        }).then(() => true);
    }

    deleteFile(filePath: string): Promise<boolean> {
        return Filesystem.deleteFile({
            directory: FilesystemDirectory.Data,
            path: filePath
        }).then(() => true);
    }

    deleteDirectory(filePath: string) : Promise<boolean> {
        return Filesystem.rmdir({
            directory: FilesystemDirectory.Data,
            path: filePath,
            recursive: true
        }).then(() => true);
    }

    loadFile(filePath: string): Promise<string> {
        return Filesystem.readFile({
            directory: FilesystemDirectory.Data,
            encoding: FilesystemEncoding.UTF8,
            path: filePath
        }).then((r) => r.data);
    }

    enumDirectory(dirPath: string): Promise<string[]> {
        return Filesystem.readdir({
            directory: FilesystemDirectory.Data,
            path: dirPath
        }).then((r) => r.files);
    }

    isFile(filePath: string): Promise<boolean> {
        return Filesystem.stat({
            directory: FilesystemDirectory.Data,
            path: filePath
        }).then((r) =>  (['NSFileTypeRegular', 'file']).indexOf(r.type) >= 0,
                (e) => false);
    }
}
