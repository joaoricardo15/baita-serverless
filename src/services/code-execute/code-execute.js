const vm = require('vm');

exports.handler = (event, context, callback) => {

    const { input_data } = event;

    const code = `${input_data.code}`;

    const code_input = {};

    for(var var_name in input_data)
        if (var_name !== 'code') code_input[var_name] = input_data[var_name]

    const script = new vm.Script(code);

    vm.createContext(code_input);

    try {
        script.runInContext(code_input, { displayErrors: true, timeout: 5000 });
        
        callback(null, {
            success: true, 
            data: code_input.output
        });
    }
    catch (error) {
        callback(null, {
            success: false,
            ...error
        });
    }
}