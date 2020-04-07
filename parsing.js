const statements = require("./statements");

function parsing(value){
    let new_data = [];
	for (v of value){
        const returned_statement = statements[v.type];
        if (!returned_statement) throw new Error(`Invalid statement for ${v.type}`);
        if (returned_statement) new_data.push(returned_statement(v, parsing));
    }
    return new_data.join("\n");
}

module.exports = parsing;