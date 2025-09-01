const fs = require('fs');
const HTTP_Publisher = require('./http-publisher');

class PNG_Publisher extends HTTP_Publisher {
  constructor(spec) {
    super(spec);
    this.filePath = spec.filePath;
    this.resource = spec.resource;
  }

  handle_http(req, res) {
    if (req.method !== 'GET') {
      res.writeHead(405, { 'Allow': 'GET' });
      return res.end('Method Not Allowed');
    }

    const sendBuffer = buf => {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', buf.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.end(buf);
    };

    if (this.resource && typeof this.resource.getPNG === 'function') {
      Promise.resolve(this.resource.getPNG())
        .then(buf => sendBuffer(buf))
        .catch(() => {
          res.writeHead(500);
          res.end('Internal Server Error');
        });
    } else if (this.filePath) {
      fs.readFile(this.filePath, (err, buf) => {
        if (err) {
          res.writeHead(404);
          return res.end('Not Found');
        }
        sendBuffer(buf);
      });
    } else {
      res.writeHead(500);
      res.end('No PNG resource configured');
    }
  }
}

module.exports = PNG_Publisher;