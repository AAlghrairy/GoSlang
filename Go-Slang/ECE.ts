export class ECE {
    public static execute(sourceCode: any): string {
        // @ts-ignore
        const go2json = require("go2json/go2json.js");
        let C = go2json.go2ast(sourceCode);
        return C;
    }
}

export default ECE;
