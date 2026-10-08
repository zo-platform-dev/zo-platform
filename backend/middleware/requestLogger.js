const winston = require('winston');
const morgan = require('morgan');

const requestLogger = morgan('combined', {
  stream: {
    write: (message) => {
      winston.info(message.trim());
    }
  }
});

module.exports = { requestLogger };