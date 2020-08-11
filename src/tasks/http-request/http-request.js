const https = require('https');

exports.handler = (event, context, callback) => {
  
    const { task_data, input_data } = event;
    const { url, method } = task_data;
    
    let parsedUrl = url.split('://');
    parsedUrl = parsedUrl[1] ? parsedUrl[1] : parsedUrl[0];

    const path = parsedUrl.substring(parsedUrl.indexOf('/'));
    const hostname = parsedUrl.substring(0, parsedUrl.indexOf('/'));

    let responseString = '';
    var post_options = {
        hostname,
        path,
        method,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    };

    const req = https.request(post_options, (res) => {
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
          callback(error);
        })
    });

    if (input_data) req.write(JSON.stringify(input_data));
    req.end();
};
