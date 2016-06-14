'use strict';
const fs = require('fs');

const Duplex = require('observer').Duplex;


/**
 * Class representing a Logger.
 */
class Logger extends Duplex {
    /**
     * @summary Create a JSON Builder.
     * @constructor
     * @param {string} directory - The base directory where the log files will be stored.
     * @param {string} filebase - The base name of the log files, it will be extended with the used channel (following the `${filebase}.${channel}.log` pattern).
     * @param {string} [prefix] - The (optional) prefix of the events send by the Logger.
     */
    constructor(directory, filebase, prefix) {
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

    /**
     * @summary Redirect events in a channel.
     * @description The provided events data is written in the log channel corresponding to the provided identifier (prefixed with the provided header).
     * @param {Array<string>} events - The base directory where the log files will be stored.
     * @param {string} identifier - The identifier of the channel (suffix of the log file name following the `${filebase}.${channel}.log` pattern).
     * @param {Function} [header] - The (optional) header used to log data in this channel (the channel identifier by default); the function type allows runtime evaluation.
     */
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
