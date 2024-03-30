import { go2json } from "./go2json/go2json.js";

export class ECE {
    readonly head = (arr: any[]) => arr[0];
    readonly tail = (arr: any[]) => arr.slice(1);

    private static apply_binop = (v1, op, v2) => this.binop_microcode[op](v1,v2);

    private static binop_microcode = {
        '+': (x, y) => x + y,
        '*':   (x, y) => x * y,
        '-':   (x, y) => x - y,
        '/':   (x, y) => x / y
    }

    private static microcode = {
        package:
            cmd => null,
        exec:
            cmd => this.C.push({tag: "expr"}, cmd.expr),
        expr:
            cmd => this.S.push(this.apply_binop(cmd.body[0], cmd.body[1], cmd.body[2]))

    }
    static C:  {tag: string; } [] = [];
    static S: any[] = [];
    static E: any[] = [];

    private static step_limit: number = 1000000;
    private binop_microcode: {
        "*": (x, y) => number;
        "+": (x, y) => any;
        "-": (x, y) => number;
        "/": (x, y) => number
    };
    public static executeTrue(sourceCode: string): string {
        this.C = go2json.go2ast(sourceCode);
        let S = []
        let E = [] //global_environment

        for(let i = 0; i < this.step_limit; i++) {
            if (this.C.length === 0) break
            const cmd = this.C.pop()
            if (this.microcode.hasOwnProperty(cmd.tag)) {
                this.microcode[cmd.tag](cmd)
            } else {
                throw new Error("unknown command: " + cmd.tag)
            }

            if (i === this.step_limit - 1) {
                throw new Error("step limit exceeded ")
            }
        }
        return String(S[0]);
    }
    public static execute(sourceCode: string): string[] {
        return go2json.go2ast(sourceCode);
    }
}

export default ECE;
