#!/usr/bin/env node

/*
 * This script is licensed as follows:
 *
 *     Copyright 2022 Functional Software, Inc. dba Sentry
 *
 *     Permission is hereby granted, free of charge, to any person obtaining a
 *     copy of this software and associated documentation files (the
 *     "Software"), to deal in the Software without restriction, including
 *     without limitation the rights to use, copy, modify, merge, publish,
 *     distribute, sublicense, and/or sell copies of the Software, and to
 *     permit persons to whom the Software is furnished to do so, subject to
 *     the following conditions:
 *
 *     The above copyright notice and this permission notice shall be included
 *     in all copies or substantial portions of the Software.
 *
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 *     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 *     IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 *     CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *     TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 *     SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Note that this license applies ONLY to this source code file and similarly
 * labeled files, and not necessarily to other files in the same directory or
 * repository. This software is integrated with RPG Maker MZ assets whose use
 * and distribution are governed by the RPG Maker MZ User License Agreement at
 *     https://www.rpgmakerweb.com/eula
 */

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

        const isProtocolHttp: boolean = spec.address.startsWith("http:");

        const proxyRequest = (isProtocolHttp ? http : https).request(
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

const port = 5000;
console.log("Starting server on port " + port);
const server: http.Server = http.createServer(serve);
server.listen(port);
// launchBrowser("http://localhost:" + port);
