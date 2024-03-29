import { go2json } from "./go2json/go2json.js";

export class ECE {
    public static execute(sourceCode: string): any[] {
        let C = go2json.go2ast(sourceCode);
        return C;
    }
}

export default ECE;
