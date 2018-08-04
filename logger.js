'use strict';

const winston = require('winston');
const stream = require('stream');
const level = process.env.LOG_LEVEL || 'debug';

const logger = winston.createLogger({
    level: level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
    ),
    transports: [new winston.transports.Console({})],
    exitOnError: false
});
    
logger.writableStream = new stream.Writable();
logger.writableStream._write = function (chunk, encoding, next) {
    logger.info(chunk.toString());
    next();
};

module.exports = logger