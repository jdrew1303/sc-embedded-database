describe('scEmbeddedDatabase', function () {

    var $rootScope, scEmbeddedDatabase;

    beforeEach(function () {
        module('scEmbeddedDatabase');
        inject(function (_$rootScope_, _scEmbeddedDatabase_) {
            $rootScope = _$rootScope_;
            scEmbeddedDatabase = _scEmbeddedDatabase_;
        });
    });

    describe('#executeSql', function () {

        it('test something', function () {
            var testdb = scEmbeddedDatabase.use('testdb');

            testdb.executeSql('DROP TABLE CUSTOMER');
            testdb.executeSql('CREATE TABLE CUSTOMER(ID UNIQUE, FIRST_NAME, LAST_NAME)');
            testdb.executeSql('INSERT INTO CUSTOMER(ID, FIRST_NAME, LAST_NAME) VALUES (1, "Albert", "Einstein")');
            testdb.executeSql('INSERT INTO CUSTOMER(ID, FIRST_NAME, LAST_NAME) VALUES (2, "Eliza", "Orzeszkowa")');
            var customersPromise = testdb.executeSql('SELECT ID AS id, FIRST_NAME AS firstName, LAST_NAME AS lastName FROM CUSTOMER');

            $rootScope.$digest();
            // TODO Assert that the customerPromise contains two records.
        });

    });

});
