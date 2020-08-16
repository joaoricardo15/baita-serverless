const https = require('https');

exports.handler = (event, context, callback) => {
  
    const { config, input_data } = event;
    const { url, method, headers, auth, url_params, query_params } = config;
    
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
        
    Axios({ url, auth, method, headers, data: input_data })
        .then(response => {
            callback(null, {
                success: true,
                data: request_result
            });
        }).catch(error => callback(error));
};
