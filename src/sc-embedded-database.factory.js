function embeddedDatabaseFactory($q, $log) {

    var DEFAULT_DB_VERSION = '1.0';
    var DEFAULT_DB_SIZE = 2 * 1024 * 1024;
    var DEFAULT_DB_DESCRIPTION = 'This database was created by the scEmbeddedDatabase module';
    var databases = {};

    function use(name) {
        if (angular.isUndefined(databases[name])) {
            databases[name] = openDatabase(name, DEFAULT_DB_VERSION, DEFAULT_DB_DESCRIPTION, DEFAULT_DB_SIZE);
        }

        function executeSql(sql, args) {
            var deferred = $q.defer(),
                sqlArgs = args ? args : [];

            databases[name].transaction(function (tx) {
                tx.executeSql(sql, sqlArgs, function onSuccess(tx, results) {
                    deferred.resolve(results);
                }, function onError(tx, error) {
                    $log.error('Error executing `' + sql + '` with params `' + JSON.stringify(sqlArgs) + '`: ' + error.message);
                    deferred.reject(error);
                });
            });
            return deferred.promise;
        }

        function batchUpdate(sql, batchArgs) {
            var i, promises = [];
            for (i = 0; i < batchArgs.length; i++) {
                promises.push(executeSql(sql, batchArgs[i]));
            }
            return $q.all(promises);
        }

        function queryForArray(sql, args) {
            return executeSql(sql, args).then(toArray);
        }

        function toArray(results) {
            var list = [], i;
            for (i = 0; i < results.rows.length; i++) {
                list.push(results.rows.item(i));
            }
            return list;
        }

        return {
            executeSql: executeSql,
            batchUpdate: batchUpdate,
            queryForArray: queryForArray
        };
    }

    return {
        use: use
    };

}

embeddedDatabaseFactory.$inject = ['$q', '$log'];

angular.module('scEmbeddedDatabase')
    .factory('scEmbeddedDatabase', embeddedDatabaseFactory);
