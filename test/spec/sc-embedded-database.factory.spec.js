describe('scEmbeddedDatabase', function () {

    var $rootScope, $$rowMappers, scEmbeddedDatabase;

    beforeEach(function () {
        module('scEmbeddedDatabase');
        inject(function (_$rootScope_, _$$rowMappers_, _scEmbeddedDatabase_) {
            $rootScope = _$rootScope_;
            $$rowMappers = _$$rowMappers_;
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

    describe('$$rowMappers', function () {

        it('should map simple result row', function () {
            var row = {
                "id": 10050,
                "amount": "1500 EUR",
                "period": "30 DAYS"
            };

            expect($$rowMappers.underscoreCasePropertiesToObjectTreeMapper(row)).toEqual({
                "id": 10050,
                "amount": "1500 EUR",
                "period": "30 DAYS"
            });

        });

        it('should map result row', function () {
            var row = {
                "id": 10050,
                "amount": "1500 EUR",
                "period": "30 DAYS",
                "borrower_id": 10,
                "borrower_firstName": "Albert",
                "borrower_lastName": "Einstein",
                "borrower_address_street": "112 Mercer Street",
                "borrower_address_city": "Princeton",
                "guarantor_id": 20,
                "guarantor_firstName": "Eliza",
                "guarantor_lastName": "Orzeszkowa"
            };

            expect($$rowMappers.underscoreCasePropertiesToObjectTreeMapper(row)).toEqual({
                "id": 10050,
                "amount": "1500 EUR",
                "period": "30 DAYS",
                "borrower": {
                    "id": 10,
                    "firstName": "Albert",
                    "lastName": "Einstein",
                    "address": {
                        "street": "112 Mercer Street",
                        "city": "Princeton"
                    }
                },
                "guarantor": {
                    "id": 20,
                    "firstName": "Eliza",
                    "lastName": "Orzeszkowa"
                }
            });

        });

    });

});
