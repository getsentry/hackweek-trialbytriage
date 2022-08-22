#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs");
var http = require("http");
var https = require("https");
var child_process = require("child_process");
var serve = function (serverRequest, serverResponse) {
    var _a;
    function terminate(status) {
        serverResponse.writeHead(status);
        serverResponse.end();
    }
    var MIMETYPES = {
        css: "text/css",
        html: "text/html",
        js: "text/javascript",
        json: "application/json",
        ogg: "audio/ogg",
        png: "image/png"
    };
    function inferContentType(path) {
        var extension = path.match(/.*\.(\w+)$/);
        return (extension && MIMETYPES[extension[1].toLowerCase()]) || "application/octet-stream";
    }
    ;
    function serveFile(address) {
        var path = "./" + (address || "index.html");
        console.log("GET " + path);
        if (fs.existsSync(path)) {
            var readStream = fs.createReadStream(path);
            serverResponse.setHeader("Content-Type", inferContentType(path));
            serverResponse.writeHead(200);
            readStream.pipe(serverResponse, { end: true });
        }
        else {
            serverResponse.writeHead(404);
            serverResponse.end();
        }
    }
    function makeProxyRequest(spec) {
        return __awaiter(this, void 0, void 0, function () {
            var method, proxyRequest;
            return __generator(this, function (_a) {
                method = spec.method || 'GET';
                console.log("Proxy: " + method + " " + spec.address);
                proxyRequest = https.request(spec.address, {
                    method: method,
                    headers: spec.headers
                }, (function (proxyResponse) {
                    var _a;
                    for (var _i = 0, _b = Object.entries(proxyResponse.headers); _i < _b.length; _i++) {
                        var _c = _b[_i], name_1 = _c[0], value = _c[1];
                        if (value) {
                            serverResponse.setHeader(name_1, value);
                        }
                    }
                    serverResponse.writeHead((_a = proxyResponse.statusCode) !== null && _a !== void 0 ? _a : 500);
                    proxyResponse.on('data', function (chunk) {
                        serverResponse.write(chunk);
                    });
                    proxyResponse.on('end', function () {
                        serverResponse.end();
                    });
                }));
                proxyRequest.end();
                return [2 /*return*/];
            });
        });
    }
    var address = ((_a = serverRequest.url) !== null && _a !== void 0 ? _a : "").replace(/(^\/*|\/*$)/, "").replace(/\/+/, "/");
    if (serverRequest.method === 'GET') {
        serveFile(address);
    }
    else if (serverRequest.method === 'POST') {
        if (address !== "proxy") {
            return terminate(404);
        }
        var text_1 = '';
        serverRequest.on('readable', function () {
            var _a;
            text_1 += (_a = serverRequest.read()) !== null && _a !== void 0 ? _a : "";
        });
        serverRequest.on('end', function () {
            var body;
            try {
                body = JSON.parse(text_1);
            }
            catch (e) {
                return terminate(400);
            }
            if (!body.address) {
                return terminate(400);
            }
            makeProxyRequest({
                method: body.method,
                address: body.address,
                headers: body.headers
            });
        });
    }
    else {
        terminate(404);
    }
};
function launchBrowser(url) {
    var command = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    child_process.exec(command + ' ' + url);
}
var port = 5000;
var server = http.createServer(serve);
server.listen(port);
// launchBrowser("http://localhost:" + port);
