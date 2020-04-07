module.exports = {
    ["var_name"]: function(value){
        return value.name || (value.identifier && value.identifier.name) || value.raw || "undefined";
    }
}