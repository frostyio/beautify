const statements = require("./statements");
const funcs = require("./funcs");

module.exports = {
    ["StringLiteral"]: function(literal){
        return !literal.inParens && literal.raw || `(${literal.raw})`;
    },
    ["Identifier"]: function(Identifier){
        return funcs.var_name(Identifier);
    },
    ["FunctionDeclaration"]: function(value, parsing, indent, indent_funcs){
        let current = `${value.inParens && "(" || ""}function(`;
    
        let num = 0;
        for (para of value.parameters){
            current = current + `${num != 0 && ", " || ""}${funcs.var_name(para)}`;
            num++;
        }
    
        current += ")\n";
    
        indent_funcs.increase();    
        current += parsing(value.body);
        indent_funcs.decrease();
    
        return current + `\n${indent()}end${value.inParens && ")" || ""}`
    },
    ["BooleanLiteral"]: function(value){
        return value.raw;
    },
    ["NumericLiteral"]:  function(value){
        return value.raw;
    },
    ["VarargLiteral"]: function(value){
        return value.raw;
    },
    ["NilLiteral"]: function(value){
        return value.raw;
    }
};