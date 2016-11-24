var mssql    = require('mssql');
var dbconfig = require('../config/database');

mssql.connect(dbconfig.connection).then(function() {
  var request = new mssql.Request();
  request.query( 'CREATE DATABASE ' + dbconfig.database ).then(function(recordset) {
    console.log("Database Created!");
  }).catch(function(err) {
    console.log('Request error: ' + err);
  });

  request.query( '\
                CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.users_table + '` ( \
                    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, \
                    `username` VARCHAR(20) NOT NULL, \
                    `password` CHAR(60) NOT NULL, \
                        PRIMARY KEY (`id`), \
                    UNIQUE INDEX `id_UNIQUE` (`id` ASC), \
                    UNIQUE INDEX `username_UNIQUE` (`username` ASC) \
                )' 
  ).then(function(recordset) {
    console.log("Table Created!");
  }).catch(function(err) {
    console.log('Request error: ' + err);
  });

  request.cancel();
}).catch(function(err) {
  if (err) {
    console.log('SQL Connection Error: ' + err);
  }
});
