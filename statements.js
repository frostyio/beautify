const literals = require("./literals");
const funcs = require("./funcs");
const expressions = require("./expressions");

let current_indent = 0;

const indent_funcs = {increase: function(){current_indent++}, decrease: function(){current_indent--}};

function indent(){ if (current_indent == 0) return ""; return `\t`.repeat(current_indent) };

function parse_expression(expression, parsing){
    const returned_expression = expressions[expression.type];
    if (!returned_expression) throw new Error(`Invalid expression for ${expression.type}`);
    return returned_expression(expression, parsing, indent, indent_funcs);
}
function parse_literal(literal, parsing){ 
    if (literal.type.match("Expression")) return parse_expression(literal, parsing);
    const returned_literal = literals[literal.type];
    if (!returned_literal) throw new Error(`Invalid literal for ${literal.type}`);
    return returned_literal(literal, parsing, indent, indent_funcs);
}

module.exports = {
    ["LocalStatement"]: function(value, parsing){
        let string = `${indent()}local`;
        
        let variables = 0;
        for (variable of value.variables){
            string += `${variables != 0 && "," || ""} ${funcs.var_name(variable)}`;
            variables++;
        }

        string += " =";

        let literal_count = 0;
        for (literal of value.init){
            string += `${literal_count != 0 && "," || ""} ${parse_literal(literal, parsing)}`;
            literal_count++;
        }

        return string;
    },
    ["AssignmentStatement"]: function(value, parsing){
        let string = `${indent()}`;
        
        let variables = 0;
        for (variable of value.variables){
            string += `${variables != 0 && ", " || variables != 0 && " " || ""}${funcs.var_name(variable)}`;
            variables++;
        }

        string += " =";

        let literal_count = 0;
        for (literal of value.init){
            string += `${literal_count != 0 && "," || ""} ${parse_literal(literal, parsing)}`;
            literal_count++;
        }

        return string;
    },
    ["CallStatement"]: function(value, parsing){
        if (value.expression.type == "CallExpression" || value.expression.base.type == "MemberExpression"){
            return parse_literal(value.expression, parsing)
        }
        let string = `${indent()}${value.expression.base.name}(`;

        let arguments = value.expression.argument;
        if (arguments) arguments = [arguments];
        if (!arguments) arguments = value.expression.argument;
        if (!arguments) arguments = [];

        let arg_count = 0;
        for (arg of arguments){
            string += `${arg_count != 0 && ", " || ""}${parse_literal(arg, parsing)}`;
            arg_count++;
        }
        return string += ")";
    },
    ["FunctionDeclaration"]: function(value, parsing){
        let current = `${indent()}${value.isLocal && !value.inParens && "local " || ""}`;

        if (value.identifier) current += `function ${funcs.var_name(value.identifier)}(`;
        //current +=  `${value.inParens && "(" || ""}function(`;
    
        let num = 0;
        for (para of value.parameters){
            current = current + `${num != 0 && ", " || ""}${funcs.var_name(para)}`;
            num++;
        }
    
        current += ")\n";
    
        current_indent++;    
        current += parsing(value.body, parsing);
        current_indent--;
    
        return current + `\n${indent()}end${value.inParens && ")" || ""}`
    },
    ["WhileStatement"]: function(value, parsing){
        let current = `${indent()}while `;

        current += parse_literal(value.condition, parsing) + ` do\n`
    
        current_indent++;
        const ret = parsing(value.body, parsing);
        current += ret;
        current_indent--;

        current += `\n${indent()}end`
    
        return current;
    },
    ["RepeatStatement"]: function(value, parsing){
        let current = `${indent()}repeat\n`;
    
        current_indent++;
        const ret = parsing(value.body, parsing);
        current += ret;
        current_indent--;

        current += `${indent()}\nuntil ${parse_literal(value.condition, parsing)}`;

        return current;
    },
    ["ForNumericStatement"]: function(value, parsing){
        const start = value.start.raw || value.start.name || parse_literal(value.start, parsing);
        const end = value.end.raw || value.end.name || parse_literal(value.end, parsing);
        const step = value.step && (value.step.raw || value.step.name || parse_literal(value.step, parsing)) ||  "";
        let current = `${funcs.var_name(value.variable)} = ${start}, ${end}${value.step && ", " + step + " " || ""}`;
        current = `${indent()}for ` + current + ` do\n`;

        current_indent++;
        const ret = parsing(value.body);
        current_indent--;
        current+=ret;
    
        return current + `\n${indent()}end`;
    },
    ["ForGenericStatement"]: function(data, parsing){
        let current = `${indent()}for `;

        // variable names
        let num = 0;
        for (v of data.variables){
            current += `${num != 0 && ", " || ""}${funcs.var_name(v)}`
            num++;
        }
    
        current += " in ";
    
        num = 0;
        for (iterator of data.iterators){
            current = current + `${num != 0 && `, ` || ""}${parse_literal(iterator, parsing)}`;
            num++;
        }	
    
        current += ` do\n`;
    
        current_indent++;
    
        const ret = parsing(data.body);
    
        current_indent--;
    
        current += ret;
    
        return current + `\n${indent()}end`;
    },
    ["ReturnStatement"]: function(data, parsing){
        let current = "";
        let number = 0;
        const old_indent = current_indent;
        current_indent = 0;
        for (arg of data.arguments){
            number++;
            current += parse_literal(arg, parsing) + `${data.arguments.length != number && "," || ""}`;
        }
        current_indent = old_indent;
        current =  `${indent()}return ${current.substr(0, current.length - 0)}`;
        return current;
    },
    ["BreakStatement"]: function(data, parsing){
        return indent() + "break";
    },
    ["DoStatement"]: function(data, parsing){
        let current = `${indent()}do\n`;

        current_indent++;
        const ret = parsing(data.body, parsing);
        current_indent--;
    
        current += ret;
    
        return current + `\n${indent()}end`;
    },
    ["IfStatement"]: function(data, parsing){
        let current = `${indent()}if `;

        for (clause of data.clauses){
            const old_indent = current_indent;
            current_indent = 0;
            if (clause.type == "IfClause"){
                current += `${parse_literal(clause.condition, parsing)} then\n`;
            } else if (clause.type == "ElseClause") {
                current += `${indent()}else\n`;
            } else if (clause.type == "ElseifClause") {
                current += `${indent()}elseif ${parse_literal(clause.condition, parsing)} then\n`;
            }
            current_indent = old_indent;
    
            current_indent++;
            const ret = parsing(clause.body, parsing);
            current_indent--;
            current += ret;
        }
    
        return current + `\n${indent()}end`;
    },

    parse_literal: parse_literal,
    parse_expression: parse_expression
};