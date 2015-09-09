function embeddedDatabaseFactory($q, $log, $$rowMappers) {

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

        function queryForObject(sql, args) {
            return executeSql(sql, args).then(toArray).then(firstElement);
        }

        function toArray(results) {
            var list = [], i;
            for (i = 0; i < results.rows.length; i++) {
                list.push(
                    $$rowMappers.underscoreCasePropertiesToObjectTreeMapper(results.rows.item(i))
                );
            }
            return list;
        }

        function firstElement(array) {
            return array[0];
        }

        return {
            executeSql: executeSql,
            batchUpdate: batchUpdate,
            queryForArray: queryForArray,
            queryForObject: queryForObject
        };
    }

    return {
        use: use
    };

}

function $$rowMappersFactory() {
    function identityMapper(row) {
        return row;
    }

    function underscoreCasePropertiesToObjectTreeMapper(source) {
        var obj = {};

        Object.keys(source).forEach(function (prop) {
            popInsert(obj, prop.split('_'), source[prop]);
        });

        return obj;

        function popInsert(obj, path, value) {
            var first = path[0];
            if (path.length === 1) {
                obj[first] = value;
            } else {
                var first = path[0];
                obj[first] = obj[first] || {};
                popInsert(obj[first], path.slice(1, path.length), value);
            }
        }
    }

    return {
        identityMapper: identityMapper,
        underscoreCasePropertiesToObjectTreeMapper: underscoreCasePropertiesToObjectTreeMapper
    }
}

embeddedDatabaseFactory.$inject = ['$q', '$log', '$$rowMappers'];

angular.module('scEmbeddedDatabase')
    .factory('scEmbeddedDatabase', embeddedDatabaseFactory)
    .factory('$$rowMappers', $$rowMappersFactory);
