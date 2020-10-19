const Axios = require('axios');
const xml2js = require('xml2js');

exports.handler = (event, context, callback) => {

    

    const { connection, config, input_data, output_path } = event;
    const { path, method, headers, auth, body_params, url_params, query_params } = config;
    
    let { api_url: url } = connection.app_config;

    url += path;

    if (url_params && url_params.length) {
        url += '/';
        for (let i = 0; i < url_params.length; i++) {
            const source =
                url_params[i].value !== undefined ? url_params[i].value :
                url_params[i].service_config ? config[url_params[i].service_config] : 
                url_params[i].service_auth ? auth[url_params[i].service_auth] : 
                url_params[i].input_field ? input_data[url_params[i].input_field] : ''
    
            const encoded_source = encodeURIComponent(source).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16));

            url += `${encoded_source}/`
        }
    }

    if (query_params && query_params.length) {
        url += '?';
        for (let i = 0; i < query_params.length; i++) {
            const source = 
                query_params[i].value !== undefined ? query_params[i].value :
                query_params[i].service_config ? config[query_params[i].service_config] : 
                query_params[i].service_auth ? auth[query_params[i].service_auth] : 
                query_params[i].input_field ? input_data[query_params[i].input_field] : ''

            const encoded_source = encodeURIComponent(source).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16));
        
            url += `${query_params[i].var_name}=${encoded_source}&`;
        }
    }

    let data = {};
    if (body_params && body_params.length) {
        url += '/';
        for (let i = 0; i < body_params.length; i++) {
            const source =
                body_params[i].value !== undefined ? body_params[i].value :
                body_params[i].service_config ? config[body_params[i].service_config] : 
                body_params[i].service_auth ? auth[body_params[i].service_auth] : 
                body_params[i].input_field ? input_data[body_params[i].input_field] : ''
    
            data[body_params[i].var_name] = source;
        }
    }

console.log({ url, method, headers, data })
    Axios({ url, method, headers, data })
        .then(response => {

            console.log(response.data)

            if (!response.data)
                return callback(null, { 
                    success: true, 
                    message: response.message || response.errorMessage || 'nothing for you this time : (' 
                });
            else {

                // xml2js.parseString(response.data, { mergeAttrs: true }, (err, result) => {
                //     if (err) {
                //         throw err;
                //     }
                
                    let output_data = response.data // result

                    if (output_path) {
                        const paths = output_path.split('.');

                        for (let i = 0; i < paths.length; i++) {
                            const type = paths[i].split(':')[0];
                            const value = paths[i].split(':')[1];
                            output_data = output_data[type === 'number' ? parseInt(value) : value]                
                        }
                    }

                    callback(null, {
                        success: true,
                        data: output_data
                    });
                    
                // })

            }
        }).catch(error => callback(null, {
            success: false,
            message: 'nothing for you this time : ('
        }));
};
