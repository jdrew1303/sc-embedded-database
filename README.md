sc-embedded-database
====================

[![npm version](https://badge.fury.io/js/sc-embedded-database.svg)](http://badge.fury.io/js/sc-embedded-database)
[![Bower version](https://badge.fury.io/bo/sc-embedded-database.svg)](http://badge.fury.io/bo/sc-embedded-database)

> Beware. This module depends on [Web SQL Database](http://www.w3.org/TR/webdatabase/)
> specification which is no longer in active maintenance.

## WTF?

### Assumptions

I assume that you're:

1. a frontend developer (including hipsters)
2. using [AngularJS](https://angularjs.org/)
3. getting dizzy whenever you hear the words **backend**, **transaction**, **ACID**, **scalable**, or similar
4. familiar with SQL
5. displaying some meaningful data in you next kick-ass application
6. lazy and want to transition from POC to a production ready code real quick

### Example

Imagine that you're in the customer lending domain trying to do a POC and convince investors
to support your project. A customer is in a need to borrow some money fast. Therefore you app has
to track all borrowers, their personal and contact data as well as loan requests. Tracking overdue
loans and calculating penalty rates is a part of the business too.

So they teach in kindergarten that you may go with the following
[relational model](https://en.wikipedia.org/wiki/Relational_model) to store the data.

#### CUSTOMER

The `CUSTOMER` table holds basic customer details.

| ID (PK) | FIRST_NAME | LAST_NAME   |
|--------:|------------|-------------|
|      10 | Albert     | Einstein    |
|      20 | Eliza      | Orzeszkowa  |
|      30 | Henryk     | Sienkiewicz |

#### LOAN

The `LOAN` table holds loan details.

| ID (PK)    | AMOUNT   | PERIOD  | STATUS    |
|-----------:|---------:|--------:|-----------|
| 10050      | 1500 EUR | 30 DAYS | REQUESTED |
| 10060      | 1000 EUR | 15 DAYS | OVERDUE   |
| 20100      |  500 EUR |  7 DAYS | ACTIVE    |

> **Note** This example is intentionally contrived. Even though I've seen such
> things in production code, representing the amount and period as `VARCHAR`s
> in your database is probably not the best idea.

#### CUSTOMER_LOAN

The `CUSTOMER_LOAN` table holds zero to many loans taken by a customer.

| CUSTOMER_ID (FK) | LOAN_ID (FK) |
|-----------------:|-------------:|
|               10 |        10050 |
|               10 |        10060 |
|               20 |        20100 |

#### Naïve service implementation

Having done the domain modeling you can start messing up with JavaScript and end up with the following AngularJS
[service](https://docs.angularjs.org/guide/services) for fetching some test loans:

```js
angular.module('scJanPozycz.loan', ['ng'])
   .factory('loanRepository', loanRepositoryFactory);

loanRepositoryFactory.$inject = ['$q'];

function loanRepositoryFactory($q) {
   function findAll() {
      return $q.when([
         {id: 10250, amount: 1600, borrower: {id: 1, firstName: 'Albert', lastName: 'Einstein'}},
         {id: 10240, amount: 1400, borrower: {id: 2, firstName: 'Eliza', lastName: 'Orzeszkowa'}}
      ]);
   }

   function findOne(id) {
      return new Error('Not implemented yet!');
   }

   function findByBorrowerId(borrowerId) {
      throw new Error('Not implemented yet!');
   }

   return {
      findAll: findAll,
      findOne: findOne,
      findByBorrowerId: findByBorrowerId
   };
}
```

#### DRY service implementation

```js
function loanRepositoryFactory(scEmbeddedDatabase) {

  var janpozyczdb = scEmbeddedDatabase.use('janpozyczdb');

  function findAll() {
    return janpozyczdb.executeSql(
      'SELECT ' +
      '  L.ID AS id, ' +
      '  L.AMOUNT AS amount, ' +
      '  L.PERIOD AS period, ' +
      '  C.ID AS borrower_id, ' +
      '  C.FIRST_NAME AS borrower_firstName, ' +
      '  C.LAST_NAME AS borrower_lastName ' +
      'FROM LOAN AS L ' +
      '  INNER JOIN CUSTOMER_LOAN CL ON L.ID = CL.LOAN_ID ' +
      '  INNER JOIN CUSTOMER C ON CL.CUSTOMER_ID = C.ID'
    ).then(toArray);
  }

  function findOne(id) {
    return janpozyczdb.executeSql(
      'SELECT L.ID AS id, ' +
      '  L.AMOUNT AS amount, ' +
      '  L.PERIOD AS period, ' +
      '  C.ID AS borrower_id, ' +
      '  C.FIRST_NAME AS borrower_firstName, ' + '' +
      '  C.LAST_NAME AS borrower_lastName ' +
      'FROM LOAN AS L ' +
      '  INNER JOIN CUSTOMER_LOAN CL ON L.ID = CL.LOAN_ID ' +
      '  INNER JOIN CUSTOMER C ON CL.CUSTOMER_ID = C.ID ' +
      'WHERE L.ID = ?', [id]
    ).then(toArray).then(firstElement);
  }

  function findByBorrowerId(borrowerId) {
    return janpozyczdb.executeSql(
      'SELECT ' +
      '  L.ID AS id, ' +
      '  L.AMOUNT AS amount, ' +
      '  L.PERIOD AS period, ' +
      '  C.ID AS borrower_id, ' +
      '  C.FIRST_NAME AS borrower_firstName, ' +
      '  C.LAST_NAME AS borrower_lastName ' +
      'FROM LOAN AS L' +
      '  INNER JOIN CUSTOMER_LOAN CL ON L.ID = CL.LOAN_ID ' +
      '  INNER JOIN CUSTOMER C ON CL.CUSTOMER_ID = C.ID ' +
      'WHERE C.ID = ?', [borrowerId]
    ).then(toArray);
  }

  return {
    findAll: findAll,
    findOne: findOne,
    findByBorrowerId: findByBorrowerId
  };
}

loanRepositoryFactory.$inject = ['scEmbeddedDatabase'];

angular.module('scJanPozycz.loan', ['scEmbeddedDatabase'])
  .factory('loanRepository', loanRepositoryFactory);
```

It's important to realize how the aliases in the SELECT clause determine the returned data format.
A proper use of the `_` underscore character allows you to return some columns as the properties of
an embedded object.

For example, the following SELECT statement:

```sql
SELECT
  L.ID AS id,
  L.AMOUNT AS amount,
  L.PERIOD AS period,
  C.ID AS borrower_id,
  C.FIRST_NAME AS borrower_firstName,
  C.LAST_NAME AS borrower_lastName
FROM LOAN AS L
  INNER JOIN CUSTOMER_LOAN CL ON L.ID = CL.LOAN_ID
  INNER JOIN CUSTOMER C ON CL.CUSTOMER_ID = C.ID
```

when passed to the `executeSql()` function will return the following JSON:

```js
[
  {
    id: 10050,
    amount: '1500 EUR',
    period: '30 DAYS',
    borrower: {
      id: 10,
      firstName: 'Albert',
      lastName: 'Einstein'
    }
  },
  {
    id: 10060,
    amount: '1000 EUR',
    period: '15 DAYS',
    borrower: {
      id: 10,
      firstName: 'Albert',
      lastName: 'Einstein'
    }
  },
  {
    id: 20100,
    amount: '500 EUR',
    period: '7 DAYS',
    borrower: {
      id: 20,
      firstName: 'Eliza',
      lastName: 'Orzeszkowa'
    }
  }
]
```

#### Data module

I'd recommend writing a dedicated module for creating your embedded database
and populating it with sample data.

```js
function createDatabase(scEmbeddedDatabase) {
  var janpozyczdb = scEmbeddedDatabase.use('janpozyczdb');

  janpozyczdb.executeSql('DROP TABLE CUSTOMER');
  janpozyczdb.executeSql('CREATE TABLE CUSTOMER(ID UNIQUE, FIRST_NAME, LAST_NAME)');
  janpozyczdb.executeSql('INSERT INTO CUSTOMER(ID, FIRST_NAME, LAST_NAME) VALUES (10, "Albert", "Einstein")');
  janpozyczdb.executeSql('INSERT INTO CUSTOMER(ID, FIRST_NAME, LAST_NAME) VALUES (20, "Eliza", "Orzeszkowa")');
  janpozyczdb.executeSql('INSERT INTO CUSTOMER(ID, FIRST_NAME, LAST_NAME) VALUES (30, "Henryk", "Sienkiewicz")');

  janpozyczdb.executeSql('DROP TABLE LOAN');
  janpozyczdb.executeSql('CREATE TABLE LOAN(ID UNIQUE, AMOUNT, PERIOD, STATUS)');
  janpozyczdb.executeSql('INSERT INTO LOAN(ID, AMOUNT, PERIOD, STATUS) VALUES (10050, "1500 EUR", "30 DAYS", "REQUESTED")');
  janpozyczdb.executeSql('INSERT INTO LOAN(ID, AMOUNT, PERIOD, STATUS) VALUES (10060, "1000 EUR", "15 DAYS", "OVERDUE")');
  janpozyczdb.executeSql('INSERT INTO LOAN(ID, AMOUNT, PERIOD, STATUS) VALUES (20100, "500 EUR", "7 DAYS", "ACTIVE")');

  janpozyczdb.executeSql('DROP TABLE CUSTOMER_LOAN');
  janpozyczdb.executeSql('CREATE TABLE CUSTOMER_LOAN(CUSTOMER_ID, LOAN_ID)');
  janpozyczdb.executeSql('INSERT INTO CUSTOMER_LOAN(CUSTOMER_ID, LOAN_ID) VALUES(10, 10050)');
  janpozyczdb.executeSql('INSERT INTO CUSTOMER_LOAN(CUSTOMER_ID, LOAN_ID) VALUES(10, 10060)');
  janpozyczdb.executeSql('INSERT INTO CUSTOMER_LOAN(CUSTOMER_ID, LOAN_ID) VALUES(20, 20100)');
}

createDatabase.$inject = ['scEmbeddedDatabase'];

angular.module('scJanPozycz.data', ['scEmbeddedDatabase'])
  .run(createDatabase);
```

Then add it as a dependency for your app:

```js
angular.module('scJanPozycz', [
  'ngRoute',
  'scJanPozycz.data',
  'scJanPozycz.security',
  'scJanPozycz.customer',
  'scJanPozycz.loan'
]);
```
