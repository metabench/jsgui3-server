

const Publishers = {
    'css': require('./http-css-publisher'),
    'function': require('./http-function-publisher'),
    'html_page': require('./http-html-page-publisher'),
    'html': require('./http-html-publisher'),
    'jpeg': require('./http-jpeg-publisher'),
    'js': require('./http-js-publisher'),
    'observable': require('./http-observable-publisher'),
    'sse': require('./http-sse-publisher'),
    'png': require('./http-png-publisher'),
    'resource': require('./http-resource-publisher'),
    'svg': require('./http-svg-publisher')
}

module.exports = Publishers;
