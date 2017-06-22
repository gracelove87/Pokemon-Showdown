'use strict'

//MySQL Database Manager by Lights

global.mysql = require('mysql');

//MySQL Database Settings to be used when connection
try {
  const SETTINGS = JSON.parse(require('fs').readFileSync('./config/mysqlsettings.json', 'utf-8'));
} catch (e) {
  console.log('err loading mysql DB settings: ' + e);
}

//DB Manager Init Queries
const INIT_QUERIES;

module.exports = class DatabaseManager {
  constructor() {
    this.spawned = Date.now();
    this.crashes = new Map();
    this.settings = SETTINGS;
    this.initQueries = INIT_QUERIES;
    this.runInit = false;
  }

  crash(str, err) {
    //Error Handler, built in if you don't have your own
    let now = Date.now();
    this.crashes.set(now, [str, err]);

    console.log(str);

    let crashType = require('./crashlogger')(err, 'The main process');
		if (crashType === 'lockdown') {
			Rooms.global.startLockdown(err);
		} else {
			Rooms.global.reportCrash(err);
		}
  }

  query(sql, callback) {
    let connection = mysql.createConnection(this.settings);

    connection.on('error', function(err) {
			this.crash(`MySQL Error`, err); //Feel free to use your own error handler
			if (callback) callback(false);
			return connection.destroy();
		});

		connection.connect(function(err) {
			if (err) {
				this.crash(`MySQL Connect Error`, err); //Feel free to use your own error handler
				if (callback) callback(false);
				return connection.destroy();
			}

      function a(connection, str, callback) {
        connection.query(str, function(err, rows) {
  				if (err) {
  					this.crash(`MySQL Query Error`, err); //Feel free to use your own error handler
  				}
          return callback((err || !rows || !rows[0]) ? null : rows);
  			});
      }

      let queries = 0, callbacks = [];
      if (typeof sql === 'object') {
        queries = sql.length;
      } else {
        queries = 1;
        sql = [sql];
      }

      for (let i = 0; i < queries; i++) {
        a(connection, sql[i], c => {
          callbacks.push(c);
          if (callbacks.length === queries) {
            connection.end();
            return callback((queries === 1) ? callbacks[0] : callbacks);
          }
        });
      }
		});
  }

  init() {
    //Optional Init Query to run when the database is loaded
    this.query(this.initQueries, done => {
      //Optional Event Emitted when asynch query is finished
      //process.emit('Database Ready');
    });
  }

  //Add additional methods to this class to add built in functions
}
