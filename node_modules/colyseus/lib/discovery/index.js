"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NODES_SET = 'colyseus:nodes';
const DISCOVERY_CHANNEL = 'colyseus:nodes:discovery';
function getNodeAddress(node) {
    const address = (node.addressInfo.address === '::') ? `[${node.addressInfo.address}]` : node.addressInfo.address;
    return `${node.processId}/${address}:${node.addressInfo.port}`;
}
function registerNode(presence, node) {
    const nodeAddress = getNodeAddress(node);
    presence.sadd(NODES_SET, nodeAddress);
    presence.publish(DISCOVERY_CHANNEL, `add,${nodeAddress}`);
}
exports.registerNode = registerNode;
function unregisterNode(presence, node) {
    const nodeAddress = getNodeAddress(node);
    presence.srem(NODES_SET, nodeAddress);
    presence.publish(DISCOVERY_CHANNEL, `remove,${nodeAddress}`);
}
exports.unregisterNode = unregisterNode;
