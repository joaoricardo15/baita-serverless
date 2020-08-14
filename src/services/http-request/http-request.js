const https = require('https');

exports.handler = (event, context, callback) => {
  
    const { config, input_data } = event;
    const { url, method, headers, auth, url_params, query_params } = config;
    
    let parsedUrl = url.split('://');
    parsedUrl = parsedUrl[1] ? parsedUrl[1] : parsedUrl[0];

    let path = parsedUrl.substring(parsedUrl.indexOf('/'));
    const hostname = parsedUrl.substring(0, parsedUrl.indexOf('/'));
    
    if (url_params && url_params.length) {
        path += '/';
        for (let i = 0; i < url_params.length; i++) {
            const source =
                url_params[i].value !== undefined ? url_params[i].value :
                url_params[i].service_config ? config[url_params[i].service_config] : 
                url_params[i].service_auth ? auth[url_params[i].service_auth] : 
                url_params[i].input_field ? input_data[url_params[i].input_field] : ''
    
            const encoded_source = encodeURIComponent(source).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16));

            path += `${encoded_source}/`
        }
    }

    if (query_params && query_params.length) {
        path += '?';
        for (let i = 0; i < query_params.length; i++) {
            const source = 
                query_params[i].value !== undefined ? query_params[i].value :
                query_params[i].service_config ? config[query_params[i].service_config] : 
                query_params[i].service_auth ? auth[query_params[i].service_auth] : 
                query_params[i].input_field ? input_data[query_params[i].input_field] : ''

            const encoded_source = encodeURIComponent(source).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16));
        
            path += `${query_params[i].var_name}=${encoded_source}&`;
        }
    }
            
    let responseString = '';
    var request_options = {
        hostname,
        path,
        method,
        headers: {
            ...headers,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    };

    const req = https.request(request_options, (res) => {
        res.on('data', chunk => {
            responseString += chunk;
        });
        res.on('end', () => {

            let request_result
            try {
                request_result = JSON.parse(responseString); 
            }
            catch (error) {
                request_result = responseString; 
            }

            callback(null, {
                success: true,
                data: request_result
            });
        });
        res.on('error', error => {
          callback({ success: false, ...error });
        });
    });

    if (input_data) req.write(JSON.stringify(input_data));
    req.end();
};
