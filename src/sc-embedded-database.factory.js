function embeddedDatabaseFactory($log) {

    function executeSql(sql, params) {
        $log.debug('Executing `' + sql + '` with params `' + params + '`');
    }

    return {
        executeSql: executeSql
    };

}

embeddedDatabaseFactory.$inject = ['$log'];

angular.module('scEmbeddedDatabase')
    .factory('scEmbeddedDatabase', embeddedDatabaseFactory);
