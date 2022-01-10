const fs = require('fs');

const requestHandler = (req, res) => {
    const url = req.url;
    if (url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.write('<html>');
        res.write('<body>');
        res.write('<form action="\message" method="post">');
        res.write('<input type="text" name="message" />');
        res.write('<button type="submit">Send</button> ');
        res.write('</form>');
        res.write('</body>');
        return res.write('</html>');
    }
    if (url === '/message' && req.method === 'POST') {
        const body = [];
        req.on('data', (chunk) => {
            console.log(chunk);
            body.push(chunk);
        });
        return req.on('end', () => {
            const parsedBody = Buffer.concat(body).toString();
            const message = parsedBody.split('=')[0];
            fs.writeFile('message.txt', message, err => {
                res.statusCode = 302;
                res.setHeader('Location', '/');
                return res.end();
            })
        })
    }
    res.setHeader('Content-Type', 'text/html');
    res.write('<html>');
    res.write('<body>');
    res.write('<h1>hello Sameer</h1>')
    res.write('</body>');
    res.write('</html>');

}

module.exports = requestHandler;