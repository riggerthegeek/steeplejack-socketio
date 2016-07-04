/**
 * index
 */

/// <reference path="./typings/index.d.ts" />

"use strict";


/* Node modules */


/* Third-party modules */
import * as _ from "lodash";
import * as io from "socket.io";
import {Base} from "steeplejack/lib/base";
import {IServerStrategy} from "steeplejack/interfaces/serverStrategy";
import {ISocketBroadcast} from "steeplejack/interfaces/socketBroadcast";
import {ISocketRequest} from "steeplejack/interfaces/socketRequest";
import {ISocketStrategy} from "steeplejack/interfaces/socketStrategy";


/* Files */


export class SocketIO extends Base implements ISocketStrategy {


    /**
     * Inst
     *
     * Stores the instance of the Socket.IO
     * connection
     *
     * @type {object}
     */
    protected _inst: any;


    /**
     * Broadcast
     *
     * Broadcast to the strategy.  If the target is
     * set, it sends to that target. Otherwise, it
     * broadcasts to all connected sockets.
     *
     * @param {ISocketRequest} request
     * @param {ISocketBroadcast} broadcast
     */
    public broadcast (request: ISocketRequest, broadcast: ISocketBroadcast) : void {

        if (broadcast.target === void 0) {
            broadcast.target = this.getSocketId(request.socket);
        }

        if (broadcast.target) {
            request.socket.nsp.to(broadcast.target)
                .emit(broadcast.event, ...broadcast.data);
        } else {
            request.socket.nsp.emit(broadcast.event, ...broadcast.data);
        }

    }


    /**
     * Connect
     *
     * Handles connection to the socket. When it's connected,
     * it emits a connected event.
     *
     * @param {string} namespace
     * @param {Function[]} middleware
     * @returns {SocketIO}
     */
    public connect (namespace: string, middleware: Function[]) : this {

        let nsp = this._inst
            .of(namespace);

        _.each(middleware, (fn: Function) => {
            nsp.use(fn);
        });

        nsp.on("connection", (socket: any) => {

            /* Send both the socket and the namespace */
            this.emit(`${namespace}_connected`, {
                socket,
                nsp
            });

        });

        return this;

    }


    /**
     * Create Socket
     *
     * Takes the server strategy and adds a socket
     * server to it.
     *
     * @param {IServerStrategy} server
     */
    public createSocket (server: IServerStrategy) : void {
        this._inst = io(server.getRawServer());
    }


    /**
     * Disconnect
     *
     * Disconnects from the socket
     *
     * @param {*} socket
     */
    public disconnect ({socket}: any) : void {
        socket.disconnect();
    }


    /**
     * Get Socket ID
     *
     * Gets the socket ID. This is set by
     * socket.io
     *
     * @param {*} socket
     * @returns {string}
     */
    public getSocketId ({ socket }: any) : string {
        return socket.id;
    }


    /**
     * Join Channel
     *
     * Joins a channel on the socket
     *
     * @param {*} socket
     * @param {string} channel
     */
    public joinChannel ({ socket }: any, channel: string) : void {
        socket.join(channel);
    }


    /**
     * Leave Channel
     *
     * Leaves the channel on the socket
     *
     * @param {*} socket
     * @param {string} channel
     */
    public leaveChannel ({ socket }: any, channel: string) : void {
        socket.leave(channel);
    }


    /**
     * Listen
     *
     * Listens for events on the socket
     *
     * @param {*} socket
     * @param {string} event
     * @param {function} fn
     */
    public listen ({ socket }: any, event: string, fn: () => void) {
        socket.on(event, fn);
    }


}