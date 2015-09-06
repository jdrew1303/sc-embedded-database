function embeddedDatabaseFactory($q, $log) {

    var DEFAULT_DB_VERSION = '1.0';
    var DEFAULT_DB_SIZE = 2 * 1024 * 1024;
    var DEFAULT_DB_DESCRIPTION = 'This database was created by the scEmbeddedDatabase module';
    var databases = {};

    function use(name) {
        if (angular.isUndefined(databases[name])) {
            databases[name] = openDatabase(name, DEFAULT_DB_VERSION, DEFAULT_DB_DESCRIPTION, DEFAULT_DB_SIZE);
        }

        function executeSql(sql, params) {
            var deferred = $q.defer(),
                sqlParams = params ? params : [];

            databases[name].transaction(function (tx) {
                tx.executeSql(sql, sqlParams, function onSuccess(tx, results) {
                    deferred.resolve(results);
                }, function onError(tx, error) {
                    $log.error('Error executing `' + sql + '` with params `' + JSON.stringify(sqlParams) + '`: ' + error.message);
                    deferred.reject(error);
                });
            });
            return deferred.promise;
        }

        return {
            executeSql: executeSql
        };
    }

    return {
        use: use
    };

}

embeddedDatabaseFactory.$inject = ['$q', '$log'];

angular.module('scEmbeddedDatabase')
    .factory('scEmbeddedDatabase', embeddedDatabaseFactory);
