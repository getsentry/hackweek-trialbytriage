#!/usr/bin/env node

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as child_process from 'child_process';

interface ProxyRequestSpec {
    address: string;
    method?: string;
    headers?: NodeJS.Dict<http.OutgoingHttpHeader>;
}

const serve = (serverRequest: http.IncomingMessage, serverResponse: http.ServerResponse) => {
    function terminate(status: number) {
        serverResponse.writeHead(status);
        serverResponse.end();
    }

    const MIMETYPES = {
        css: "text/css",
        html: "text/html",
        js: "text/javascript",
        json: "application/json",
        ogg: "audio/ogg",
        png: "image/png",
    }

    function inferContentType(path: string) {
        const extension = path.match(/.*\.(\w+)$/);
        return (extension && MIMETYPES[extension[1].toLowerCase()]) || "application/octet-stream";
    };

    function serveFile(address: string) {
        const path = "./" + (address || "index.html");
        console.log("GET " + path);
        if (fs.existsSync(path)) {
            const readStream = fs.createReadStream(path);
            serverResponse.setHeader("Content-Type", inferContentType(path));

            serverResponse.writeHead(200);
            readStream.pipe(serverResponse, { end: true });
        } else {
            serverResponse.writeHead(404);
            serverResponse.end();
        }
    }

    async function makeProxyRequest(spec: ProxyRequestSpec) {
        const method = spec.method || 'GET';
        console.log("Proxy: " + method + " " + spec.address);
        const proxyRequest = https.request(
            spec.address,
            {
                method: method,
                headers: spec.headers,
            },
            ((proxyResponse: http.IncomingMessage) => {
                for (const [name, value] of Object.entries(proxyResponse.headers)) {
                    if (value) {
                        serverResponse.setHeader(name, value);
                    }
                }

                serverResponse.writeHead(proxyResponse.statusCode ?? 500);
                proxyResponse.on('data', (chunk) => {
                    serverResponse.write(chunk);
                });
                proxyResponse.on('end', () => {
                    serverResponse.end();
                });
            }),
        );
        proxyRequest.end();
    }

    const address = (serverRequest.url ?? "").replace(/(^\/*|\/*$)/, "").replace(/\/+/, "/");
    if (serverRequest.method === 'GET') {
        serveFile(address);
    } else if (serverRequest.method === 'POST') {
        if (address !== "proxy") {
            return terminate(404);
        }

        let text = '';
        serverRequest.on('readable', () => {
            text += serverRequest.read() ?? "";
        });
        serverRequest.on('end', () => {
            let body;
            try {
                body = JSON.parse(text);
            } catch (e) {
                return terminate(400);
            }

            if (!body.address) {
                return terminate(400);
            }

            makeProxyRequest({
                method: body.method,
                address: body.address,
                headers: body.headers,
            });
        });
    } else {
        terminate(404);
    }
};

function launchBrowser(url: string) {
    const command = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    child_process.exec(command + ' ' + url);
}

const port = 5001;
const server: http.Server = http.createServer(serve);
server.listen(port);
// launchBrowser("http://localhost:" + port);
