/**
 * index.test
 */

/// <reference path="../typings/index.d.ts" />

"use strict";


/* Node modules */
import {EventEmitter} from "events";


/* Third-party modules */
import * as chai from "chai";
let chaiAsPromised = require("chai-as-promised");
import * as proxyquire from "proxyquire";
import * as sinon from "sinon";
let sinonAsPromised = require("sinon-as-promised");
import sinonChai = require("sinon-chai");
import {IServerStrategy} from "steeplejack/interfaces/serverStrategy";
import {ISocketBroadcast} from "steeplejack/interfaces/socketBroadcast";
import {ISocketRequest} from "steeplejack/interfaces/socketRequest";
import {ISocketStrategy} from "steeplejack/interfaces/socketStrategy";


/* Files */
import {SocketIO} from "../index";

chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;


/* Files */


describe("Socket.IO tests", function () {

    beforeEach(function () {

        this.socketRequest = {
            emit: sinon.stub(),
            params: [],
            socket: {
                socket: {
                    disconnect: sinon.spy(),
                    id: "socketId",
                    join: sinon.spy(),
                    leave: sinon.spy(),
                    on: sinon.stub()
                },
                nsp: {
                    emit: sinon.stub(),
                    to: sinon.stub()
                }
            },
            broadcast: sinon.stub(),
            disconnect: sinon.stub(),
            getId: sinon.stub(),
            joinChannel: sinon.stub(),
            leaveChannel: sinon.stub(),
            data: []
        };

        this.inst = new SocketIO();

    });

    describe("#broadcast", function () {

        it("should send to the socket id if no target set", function () {

            const emitter = sinon.spy();
            (<any> emitter).emit = sinon.spy();

            this.socketRequest.socket.nsp.to.returns(emitter);

            const broadcast: ISocketBroadcast = {
                event: "some event",
                data: [
                    1, 2, 5
                ]
            };

            expect(this.inst.broadcast(this.socketRequest, broadcast)).to.be.undefined;

            expect(this.socketRequest.socket.nsp.to).to.be.calledOnce
                .calledWithExactly("socketId");

            expect((<any> emitter).emit).to.be.calledOnce
                .calledWithExactly("some event", 1, 2, 5);

        });

        it("should send to target", function () {

            const emitter = sinon.spy();
            (<any> emitter).emit = sinon.spy();

            this.socketRequest.socket.nsp.to.returns(emitter);

            const broadcast: ISocketBroadcast = {
                event: "some event2",
                target: "some target",
                data: [
                    1, 2, 5, 6
                ]
            };

            expect(this.inst.broadcast(this.socketRequest, broadcast)).to.be.undefined;

            expect(this.socketRequest.socket.nsp.to).to.be.calledOnce
                .calledWithExactly("some target");

            expect((<any> emitter).emit).to.be.calledOnce
                .calledWithExactly("some event2", 1, 2, 5, 6);

        });

        it("should send to everything if target is null", function () {

            const broadcast: ISocketBroadcast = {
                event: "some2 event2",
                target: null,
                data: [
                    1, 3, 5
                ]
            };

            expect(this.inst.broadcast(this.socketRequest, broadcast)).to.be.undefined;

            expect(this.socketRequest.socket.nsp.emit).to.be.calledOnce
                .calledWithExactly("some2 event2", 1, 3, 5);

        });

    });

    describe("#connect", function () {

        beforeEach(function () {
            this.sock = {
                of: sinon.stub(),
                use: sinon.stub()
            };
            this.sock.of.returns(this.sock);
            (<any> this.inst)._inst = this.sock;
        });

        it("should set middleware and emit a connect event", function (done: any) {

            const emit = sinon.spy(this.inst, "emit");

            this.sock.on = (eventName: string, fn: any) => {

                expect(fn("socket")).to.be.undefined;

                expect(eventName).to.be.equal("connection");

                expect(emit).to.be.calledOnce
                    .calledWithExactly("/namespace/event_connected", {
                        socket: "socket",
                        nsp: this.sock
                    });

                done();

            };

            const fn = [
                () => {},
                () => {}
            ];

            expect(this.inst.connect("/namespace/event", fn)).to.be.equal(this.inst);


        });

    });

    describe("#createSocket", function () {

        class Strategy extends EventEmitter implements IServerStrategy {
            acceptParser: (options: string[], strict: boolean) => void;
            addRoute: (httpMethod: string, route: string, iterator: (request: any, response: any) => any) => void;
            before: (fn: Function) => void;
            bodyParser: () => void;
            close: () => void;
            enableCORS: (origins: string[], addHeaders: string[]) => void;
            getServer: () => Object;
            gzipResponse: () => void;
            outputHandler: (statusCode: Number, data: any, request: any, result: any) => any;
            queryParser: (mapParams: boolean) => void;
            start: (port: number, hostname: string, backlog: number) => any;
            uncaughtException: (fn: Function) => void;
            use: (...args: any[]) => void;
        }

        const strat = new Strategy();
        (<any> strat).getRawServer = sinon.stub()
            .returns("server");

        const io = sinon.stub()
            .returns("inst");

        const SocketIO = proxyquire("../index", {
            "socket.io": io
        }).SocketIO;

        const sock = new SocketIO();

        expect(sock.createSocket(strat)).to.be.undefined;

        expect((<any> sock)._inst).to.be.equal("inst");

    });

    describe("#disconnect", function () {

        it("should call the disconnect on the socket", function () {

            expect(this.inst.disconnect(this.socketRequest.socket)).to.be.undefined;

            expect(this.socketRequest.socket.socket.disconnect).to.be.calledOnce
                .calledWithExactly();

        });

    });

    describe("#getSocketId", function () {

        it("should return the socketId", function () {

            expect(this.inst.getSocketId(this.socketRequest.socket)).to.be.equal("socketId");

        });

    });

    describe("#joinChannel", function () {

        it("should join the channel", function () {

            expect(this.inst.joinChannel(this.socketRequest.socket, "channelName")).to.be.undefined;

            expect(this.socketRequest.socket.socket.join).to.be.calledOnce
                .calledWithExactly("channelName");

        });

    });

    describe("#leaveChannel", function () {

        it("should leave the channel", function () {

            expect(this.inst.leaveChannel(this.socketRequest.socket, "channelName")).to.be.undefined;

            expect(this.socketRequest.socket.socket.leave).to.be.calledOnce
                .calledWithExactly("channelName");

        });

    });

    describe("#listen", function () {

        it("should listen to events", function () {

            const fn = () => {};

            expect(this.inst.listen(this.socketRequest.socket, "eventName", fn)).to.be.undefined;

            expect(this.socketRequest.socket.socket.on).to.be.calledOnce
                .calledWithExactly("eventName", fn);

        });

    });

});