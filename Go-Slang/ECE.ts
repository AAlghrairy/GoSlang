import { go2json } from './go2json/go2json.js';

export class ECE {
    readonly head = (arr: any[]) => arr[0];
    readonly tail = (arr: any[]) => arr.slice(1);

    private static apply_binop = (v1, op, v2) => this.binop_microcode[op](v1,v2);

    private static binop_microcode = {
        '+': (x: number, y: number) => x + y,
        '*': (x: number, y: number) => x * y,
        '-': (x: number, y: number) => x - y,
        '/': (x: number, y: number) => x / y
    }

    private static error = (sym: string, message: string) => {
        throw new Error(message + ': ' + sym)
    }

    private static arity = (func: Function) => {
        return func.length
    }

    private static peek = (arr: any[]) => arr[arr.length - 1];
    private static push = (arr: any[], ...items: any[]) => {
        arr.splice(arr.length, 0, ...items)
        return arr
    }

    private static unassigned = {tag: 'unassigned'};
    private static is_unassigned = (value: object): boolean => {
        return value !== null && value.hasOwnProperty('tag') && value['tag'] === 'unassigned'
    };

    private static lookup = (sym: string, env: any[]) => {
        if (env === null) this.error(sym, 'Unbound name')
        if (env[0].hasOwnProperty(sym)) {
            const value = env[0][sym]
            if (this.is_unassigned(value)) this.error(sym, 'Unassigned name')
            return value
        } else {
            return this.lookup(sym, env.slice(1))
        }
    };
    private static assign = (sym: string, value: any, env: any[]) => {
        if (env === null) this.error(sym, 'Unbound name');
        if (env[0].hasOwnProperty(sym)) {
            env[0][sym] = value
        } else {
            this.assign(sym, value, env.slice(1))
        }
    }
    private static extends = (locals: any[], assign: any[], env: any[]) => {
        if (assign.length > locals.length) this.error(assign.toString(), 'Too many arguments')
        if (assign.length < locals.length) this.error(locals.toString(), 'Too few arguments')
        const new_frame = {}
        for (let i = 0; i < locals.length; i++)
            new_frame[locals[i]] = assign[i]
        return [new_frame, env]
    }

    private static scan = (body: any) => {
        return body.tag === 'seq' ?
            body.stmts.reduce((acc, stmt) => acc.concat(this.scan(stmt)), []) :
            ['let', 'const'].indexOf(body.tag) > -1 ? [body.sym] :
            body.tag === 'func' ? [body.name] : []
    }
    private static handle_sequence = (seq: any[]) => {
        if (seq.length === 0)
            return [{tag: "lit", undefined}]
        let result = []
        let first = true
        for (let cmd of seq) {
            first ? first = false
                : result.push({tag: 'pop_i'})
            result.push(cmd)
        }
        return result.reverse()
    }

    private static builtin_mapping = {
        error: this.error
    }
    private static apply_builtin = (sym: string, args: any[]) => {
        return this.builtin_mapping[sym](...args)
    }

    private static microcode = {
        lit:
            cmd => this.S.push(cmd.value),
        number:
            cmd => this.S.push(Number(cmd.value)),
        name:
            cmd => this.S.push(this.lookup(cmd.sym, this.E)),
        binop:
            cmd => {
                this.C.push({tag: 'binop_i', sym: cmd.sym})
                this.C.push(cmd.second)
                this.C.push(cmd.first)
            },
        binop_i:
            cmd => this.S.push(this.apply_binop(this.S.pop(), cmd.sym, this.S.pop())),
        pop_i:
            _ => this.S.pop(),
        package:
            _ => this.C.push({tag: 'lit', value: undefined}),
        exec:
            cmd => this.C.push(cmd.expr),
        expr:
            cmd => {
                if (cmd.body.length === 3) {
                    this.C.push({tag: 'binop', sym: cmd.body[1].value, first: cmd.body[0], second: cmd.body[2]})
                } else if (cmd.body.length === 1) {
                    this.C.push(cmd.body[0])
                }
            },
        func:
            cmd => this.C.push({
                tag: 'const',
                sym: cmd.name,
                expr: {
                    tag: 'lambda',
                    params: cmd.args,
                    body: {tag: 'seq', stmts: cmd.body}
                }
            }),
        const:
            cmd => {
                this.C.push({tag: 'lit', value: undefined})
                this.C.push({tag: 'pop_i'})
                this.C.push({tag: 'assign', sym: cmd.sym, expr: cmd.expr})
            },
        assign:
            cmd => {
                this.C.push({tag: 'assign_i', sym: cmd.sym})
                this.C.push(cmd.expr)
            },
        lambda:
            cmd => this.S.push({tag: 'closure', params: cmd.params, body: cmd.body, env: this.E}),
        assign_i:
            cmd => this.assign(cmd.sym, this.peek(this.S), this.E),
        block:
            cmd => {
                const locals = this.scan(cmd.body)
                const unassigned = locals.map(_ => this.unassigned);
                if (this.C.length !== 0) this.C.push({tag: 'env_i', env: this.E})
                this.C.push(cmd.body)
                this.E = this.extends(locals, unassigned, this.E)
            },
        seq:
            cmd => {
                const seq = this.handle_sequence(cmd.stmts)
                for (const single of seq)
                    this.C.push(single)
            },
        call:
            cmd => {
                this.C.push({tag: 'call_i', arity: cmd.args.length})
                for (let i = cmd.args.length - 1; i >= 0; i--)
                    this.C.push(cmd.args[i])
                this.C.push(cmd.fun)
            },
        call_i:
            cmd => {
                const arity = cmd.arity
                let args = []
                for (let i = arity - 1; i >= 0; i--)
                    args[i] = this.S.pop()
                const sf = this.S.pop()
                console.log(sf)
                if (sf.tag === 'builtin')
                    return this.push(this.S, this.apply_builtin(sf.sym, args))
                // remaining case: sf.tag === 'closure'
                if (this.C.length === 0 || this.peek(this.C).tag === 'env_i') {
                    // current E not needed:
                    // just push mark, and not env_i
                    this.push(this.C, {tag: 'mark_i'})
                } else if (this.peek(this.C).tag === 'reset_i') {
                    // tail call:
                    // The callee's ret_i will push another reset_i
                    // which will go to the correct mark.
                    this.C.pop()
                    // The current E is not needed, because
                    // the following reset_i is the last body
                    // instruction to be executed.
                } else {
                    // general case:
                    // push current environment
                    this.push(this.C, {tag: 'env_i', env: this.E}, {tag: 'mark_i'})
                }
                this.push(this.C, sf.body)
                this.E = this.extends(sf.params, args, sf.env)
            },
        return:
            cmd => {
                this.C.push({tag: 'reset_i'})
                if (cmd.value.body.length === 0)
                    this.C.push({tag: 'lit', value: undefined})
                else this.C.push({tag: 'expr', body: cmd.value.body})
            },
        reset_i:
            cmd => this.C.pop().tag === 'mark_i' ? null : this.C.push(cmd),
        mark_i:
            // assume return void
            _ => this.push(this.C, {tag: 'mark_i'}, {tag: 'reset_i'})
    }
    private static C: any[] = [];
    private static S: any[] = [];
    private static E: any[] = [];

    private static get_global_environment = (): any[] => {
        return [this.global_frame, null]
    }
    private static get_global_frame = (): {} => {
        const global_frame = {}
        for (const key in this.builtin_mapping)
            global_frame[key] = {
                tag: 'builtin',
                sym: key,
                arity: this.arity(this.builtin_mapping[key])
            }
        global_frame['undefined'] = undefined
        return global_frame
    }

    private static global_frame = this.get_global_frame();
    private static global_environment = this.get_global_environment();

    private static step_limit: number = 1000000;

    public static execute(sourceCode: string): string {
        this.C = [{
            tag: 'block',
            body: {
                tag: 'seq',
                stmts: go2json.go2ast(sourceCode).concat([{
                    tag: 'call',
                    args: [],
                    fun: {tag: 'name', sym: 'main'}
                }])
            }
        }]
        console.log(sourceCode)
        console.log(go2json.go2ast(sourceCode))
        this.S = []
        this.E = this.global_environment

        for(let i = 0; i < this.step_limit; i++) {
            if (this.C.length === 0) break
            const cmd = this.C.pop()
            console.log(cmd)
            if (this.microcode.hasOwnProperty(cmd.tag)) {
                this.microcode[cmd.tag](cmd)
                console.log(this.S)
            } else {
                this.error(cmd.tag, 'Unknown command')
            }

            if (i === this.step_limit - 1) {
                this.error(this.step_limit.toString(), 'Step limit exceeded')
            }
        }

        console.log(this.S[0])
        return String(this.S[0]);
    }
    public static executeJSON(sourceCode: string): string[] {
        return go2json.go2ast(sourceCode);
    }
}

export default ECE;
