'use strict';
const fs = require('fs');

const Duplex = require('../../observer').Duplex;

class Logger extends Duplex {
    constructor(prefix, directory, filebase) {
        super(prefix);
        this.directory = directory;
        this.filebase = filebase || '';
        this.channels = {};

        this.filepath = function filepath(file) {
            return `${this.directory}${this.directory.endsWith('/') ? '' : '/'}${file}`;
        };

        this.stream = function stream(file) {
            return fs.createWriteStream(this.filepath(file), { flags: 'a' });
        };
    }

    plug(events, identifier, header) {
        const channel = this.channels[identifier] = {};

        channel.stream = null;
        channel.get = () => { return channel.stream ? channel.stream : channel.stream = this.stream(`${this.filebase}.${identifier}.log`); };
        channel.header = header ? header : () => { return identifier; };

        channel.log = (message) => {
            const _message = `${channel.header()} ${message}`;
            this.notify(identifier, _message);
            channel.get().write(`${_message}\n`);
        };

        this[identifier] = channel.log;

        events.forEach((event) => {
            this.on(event, (data) => {
                this[identifier](data);
            });
        });

        return this;
    }
}

module.exports = Logger;
