import { Encoding } from "crypto";
import fs from "fs"
export default class file {
    constructor( public filename: string, public encoding: Encoding = "utf8" ) {}
    public async exists() {
        let self = this;
        try {
            await fs.promises.access( self.filename, fs.constants.F_OK );
            return true;
        } catch ( error ) {
            if ( error.code == "ENOENT" ) {
                return false;
            } else {
                throw error;
            }
        }
    }
    public async delete() {
        let self = this;
        if ( await self.exists() ) {
            await fs.promises.unlink( self.filename );
        } else {
            throw new Error("File does not exist!");
        }
    }
    public async get() {
        let self = this;
        let file = await fs.promises.readFile( self.filename, self.encoding );
        return file;
    }
    public async create( content: string = "" ) {
        let self = this;
        if ( await self.exists() ) {
            throw new Error("File already exists!");
        } else {
            await fs.promises.writeFile( self.filename, content, self.encoding );
        }
    }
    public async update( content: string = "" ) {
        let self = this;
        await fs.promises.writeFile( self.filename, content, self.encoding );
    }
}
export const tests: any = [{
    name: "file.delete_removesFile",
    context: new file( "./test/delete.txt" ),
    function: async function( ...input: any ) {
        let self = this;
        if ( (await self.exists() == false ) ) {
            await self.create();
        }
        await self.delete();
        let deleted = (await self.exists() == false);
        return deleted;
    },
    input: [],
    output: true,
    debug: false
}, {
    name: "file.exists_returnsTrue",
    context: new file( "./test/exists.txt" ),
    function: file.prototype.exists,
    input: [],
    output: true,
    debug: false
}, {
    name: "file.create_Hello World!_createsFile",
    context: new file( "./test/write.txt" ),
    function: async function ( ...input: any ) {
        let self = this;
        if ( await self.exists() ) {
            await self.delete();
        }
        await self.create( input );
        let created = (await self.exists() == true);
        return created;
    },
    input: [ "Hello World!" ],
    output: true,
    debug: false
}, {
    name: "file.get_returnsFile",
    function: file.prototype.get,
    context: new file( "./test/read.txt" ),
    input: [],
    output: "Hello World!",
    debug: false
}, {
    name: "file.update_updatesFile",
    function: async function( ...input: any ) {
        let self = this;
        if ( (await self.exists()) == false ) {
            await self.create("Hello World!");
        } else if ( (await self.get()) == "updated" ) {
            await self.delete();
            await self.create("Hello World!");
        } 
        await self.update( ...input );
        let content = await self.get();
        let updated = (content == "updated");

        await self.delete();
        await self.create("Hello World!");

        return updated;
    },
    context: new file( "./test/update.txt" ),
    input: [ "updated" ],
    output: true,
    debug: false
}];