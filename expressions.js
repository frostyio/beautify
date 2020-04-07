const literals = require("./literals");
const options = {solve_math: true}

let ind = null;
let ind_funcs = null;

function parse_expression(expression, parsing, indent, indent_funcs){
    const returned_expression = module.exports[expression.type];
    if (!returned_expression) throw new Error(`Invalid expression for ${expression.type}`);
    return returned_expression(expression, parsing, indent, indent_funcs);
}
function parse_literal(literal, parsing, indent, indent_funcs){ 
    if (indent) ind = indent;
    if (indent_funcs) ind_funcs = indent_funcs;

    if (literal.type.match("Expression")) return parse_expression(literal);
    const returned_literal = literals[literal.type];
    if (!returned_literal) throw new Error(`Invalid literal for ${literal.type}`);
    return returned_literal(literal, parsing, indent, indent_funcs);
}

module.exports = {
    ["CallExpression"]: function(value, parsing, indent, indent_funcs){
        indent = indent || ind;
        indent_funcs = indent_funcs || ind_funcs;

        let current = `${indent()}${parse_literal(value.base, parsing, indent, indent_funcs)}(`;
        let num = 0;
        for (arg of value.arguments){
            current += `${num != 0 && ", " || ""}${parse_literal(arg, parsing, indent, indent_funcs)}`;
            num++;
        }
        return current += ")";
    },
    ["TableConstructorExpression"]: function(data, parsing, indent, indent_funcs){
        indent = indent || ind;
        indent_funcs = indent_funcs || ind_funcs;

        let current = `${data.inParens && "(" || ""}{`;
        let num = 0;
        let len = data.fields.length;
        for (v of data.fields){
            if (v.type == "TableValue"){
                indent_funcs.increase();
                current = current + `${num==0 && "\n"||""}${indent()}${parse_literal(v.value, parsing, indent, indent_funcs)}${ num + 1  < len && ","|| ""}`;
                current += "\n";
                indent_funcs.decrease();
            } else if (v.type == "TableKeyString"){
                indent_funcs.increase();
                current = current + `${num==0 && "\n"||""}${indent()}${v.key.name} = ${parse_literal(v.value, parsing, indent, indent_funcs)}${ num + 1  < len && ","|| ""}`;
                current += "\n";
                indent_funcs.decrease();
            } else if (v.type == "TableKey"){
                indent_funcs.increase();
                current = current + `${num==0 && "\n"||""}${indent()}[${v.key.raw}] = ${parse_literal(v.value, parsing, indent, indent_funcs)}${ num + 1  < len && ","|| ""}`;
                current += "\n";
                indent_funcs.decrease();
            }
            num++;
        }
        current += `${len != 0 && indent() || ""}}${data.inParens && ")" || ""}`;
        return current;
    },
    ["BinaryExpression"]: function(data, parsing, indent, indent_funcs){
        indent = indent || ind;
        indent_funcs = indent_funcs || ind_funcs;
        
        if (!options.solve_math || data.right.value == undefined || data.left.value == undefined) 
            return `${parse_literal(data.left, parsing, indent, indent_funcs)} ${data.operator} ${parse_literal(data.right, parsing, indent, indent_funcs)}`;
        else {
            let lit_left = parse_literal(data.left, parsing, indent, indent_funcs);
            let lit_right = parse_literal(data.right, parsing, indent, indent_funcs);
            let left = parseInt(lit_left);
            let right = parseInt(lit_right);
            if (data.operator == "+") return right + left;
            else if (data.operator == "-") return right - left;
            else if (data.operator == "*") return right * left;
            else if (data.operator == "/") return left / right;
            else if (data.operator == "^") return Math.pow(left, right);
            // other
            else if (data.operator == ">") return `${lit_left} > ${lit_right}`;
            else if (data.operator == "<") return `${lit_left} < ${lit_right}`;
            else if (data.operator == "<=") return `${lit_left} <= ${lit_right}`;
            else if (data.operator == ">=") return `${lit_left} >= ${lit_right}`;
            else if (data.operator == "==") return `${lit_left} == ${lit_right}`;
            else if (data.operator == "..") return `${lit_left} .. ${lit_right}`;
        }
    },
    ["MemberExpression"]: function(data, parsing, indent, indent_funcs){
        return `${parse_literal(data.base, parsing, indent, indent_funcs)}${data.indexer}${data.identifier.name}`;
    },
    ["IndexExpression"]: function(data, parsing, indent, indent_funcs){
        let indexes = [];
        let basestr = "";
        function compile_indexes(base){
            indexes.push(parse_literal(base.index, parsing, indent, indent_funcs));
            basestr = base.base.name;
            if (base.base.index){
                compile_indexes(base.base);
            }
        }
        compile_indexes(data);
        indexes = indexes.reverse();
        let str = "";
        for (v of indexes){
            str = str + `[${v}]`;
        }
        return basestr + str;
    },
    ["TableCallExpression"]: function(data, parsing, indent, indent_funcs){
        indent = indent || ind;
        indent_funcs = indent_funcs || ind_funcs;

        let current = `${indent()}${parse_literal(data.base, parsing, indent, indent_funcs)}`;
        current += parse_expression(data.arguments, parsing, indent, indent_funcs);
        return current;
    }
};