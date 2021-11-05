"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.parseMessage = exports.randomCharInc = exports.generateCID = void 0;
function generateCID() {
    let cid = '';
    for (let i = 0; i < 5; i++) {
        cid += randomCharInc();
    }
    return (cid);
}
exports.generateCID = generateCID;
function randomCharInc() {
    const low = 65, // A
    high = 90; // Z
    return String.fromCharCode(Math.floor(Math.random() * (high - low + 1) + low));
}
exports.randomCharInc = randomCharInc;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
exports.sleep = sleep;
function parseMessage(msg) {
    let content = null;
    try {
        content = JSON.parse(msg.content.toString());
    }
    catch (err) {
        content = msg.content.toString();
    }
    return {
        payload: content,
        properties: msg.properties,
        fields: msg.fields
    };
}
exports.parseMessage = parseMessage;
