import { go2json } from "./go2json/go2json.js";

export class ECE {
    readonly head = (arr: any[]) => arr[0];
    readonly tail = (arr: any[]) => arr.slice(1);

    private static apply_binop = (v1, op, v2) => this.binop_microcode[op](v1,v2);

    private static binop_microcode = {
        '+': (x: number, y: number) => x + y,
        '*':   (x: number, y: number) => x * y,
        '-':   (x: number, y: number) => x - y,
        '/':   (x: number, y: number) => x / y
    }

    private static microcode = {
        package:
            cmd => null,
        exec:
            cmd => this.C.push(cmd.expr),
        expr:
            cmd => {
            if(cmd.expr !== undefined) {
                return null;
            } else {
                this.S.push(this.apply_binop(Number(cmd.body[0].value), cmd.body[1].value, Number(cmd.body[2].value)))}
            }
    }
    private static C:  {tag: any; } [] = [];
    private static S: any[] = [];
    private static E: any[] = [];

    private static step_limit: number = 1000000;

    public static execute(sourceCode: string): string {
        this.C = go2json.go2ast(sourceCode);
        this.S = []
        this.E = [] //global_environment

        for(let i = 0; i < this.step_limit; i++) {
            if (this.C.length === 0) break
            const cmd = this.C.pop()
            if (this.microcode.hasOwnProperty(cmd.tag)) {
                this.microcode[cmd.tag](cmd)
                //window.console.log(this.S)
            } else {
                throw new Error("unknown command: " + cmd.tag)
            }

            if (i === this.step_limit - 1) {
                throw new Error("step limit exceeded ")
            }
        }

        window.console.log(String(this.S[0]))
        return String(this.S[0]);
    }
    public static executeJSON(sourceCode: string): string[] {
        return go2json.go2ast(sourceCode);
    }
}

export default ECE;
