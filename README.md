sc-embedded-database
====================

[![npm version](https://badge.fury.io/js/sc-embedded-database.svg)](http://badge.fury.io/js/sc-embedded-database)
[![Bower version](https://badge.fury.io/bo/sc-embedded-database.svg)](http://badge.fury.io/bo/sc-embedded-database)

> **Beware** This module depends on [Web SQL Database](http://www.w3.org/TR/webdatabase/) specification which is no
> longer in active maintenance. But this may change soon once I find a good, pure JavaScript implementation of a SQL
> database.

## WTF?

This is an AngularJS module to rapidly feed your POC's frontend with data using SQL syntax.

### Assumptions

I assume that you're:

1. a frontend developer (including hipsters)
2. using [AngularJS](https://angularjs.org/)
3. getting dizzy whenever you hear the words **backend**, **transaction**, **ACID**, **scalable**, or similar
4. familiar with SQL
5. displaying some meaningful data in you next kick-ass application
6. lazy and want to transition from POC to a production ready code real quick

## Example

Imagine that you're in the customer lending domain trying to do a POC and convince investors to support your project.
A customer is in a need to borrow some money fast. Therefore you app has to track all borrowers, their personal and
contact data as well as loan requests. Tracking overdue loans and calculating penalty rates is a part of the business
too.

So they teach in kindergarten that you may go with the following
[relational model](https://en.wikipedia.org/wiki/Relational_model) to store the data.

### CUSTOMER

The `CUSTOMER` table holds basic customer details.

| ID (PK) | FIRST_NAME | LAST_NAME   |
|--------:|------------|-------------|
|      10 | Albert     | Einstein    |
|      20 | Eliza      | Orzeszkowa  |
|      30 | Henryk     | Sienkiewicz |

### LOAN

The `LOAN` table holds loan details.

| ID (PK)    | AMOUNT   | PERIOD  | STATUS    |
|-----------:|---------:|--------:|-----------|
| 10050      | 1500 EUR | 30 DAYS | REQUESTED |
| 10060      | 1000 EUR | 15 DAYS | OVERDUE   |
| 20100      |  500 EUR |  7 DAYS | ACTIVE    |

> **Note** This example is intentionally contrived. Even though I've seen such things in production code, representing
> the amount and period as `VARCHAR`s in your database is probably **not** the best idea.

### CUSTOMER_LOAN

The `CUSTOMER_LOAN` table holds zero to many loans taken by a customer.

| CUSTOMER_ID (FK) | LOAN_ID (FK) |
|-----------------:|-------------:|
|               10 |        10050 |
|               10 |        10060 |
|               20 |        20100 |

### Naïve service implementation

Having done the domain modeling you can start messing up with JavaScript and end up with the following AngularJS
[service](https://docs.angularjs.org/guide/services) for fetching some test loans:

```js
function loanRepositoryFactory($q) {

  var database = [{
    id: 10050,
    amount: '1500 EUR',
    borrower: {
      id: 10,
      firstName: 'Albert',
      lastName: 'Einstein'
    }
  }, {
    id: 10060,
    amount: '1000 EUR',
    borrower: {
      id: 10,
      firstName: 'Albert',
      lastName: 'Einstein'
    }
  }, {
    id: 20100,
    amount: '500 EUR',
    borrower: {
      id: 20,
      firstName: 'Eliza',
      lastName: 'Orzeszkowa'
    }
  }];

  function findAll() {
    return $q.when(database);
  }

  function findOne(id) {
    var i;
    for (i = 0; i < database.length; i++) {
      if (database[i].id === id) {
        return $q.when(database[i]);
      }
    }
    return null;
  }

  function findByBorrowerId(borrowerId) {
    var i, result = [];
    for (i = 0; i < database.length; i++) {
      if (database[i].borrower.id === borrowerId) {
        result.push(database[i]);
      }
    }
    return $q.when(result);
  }

  return {
    findAll: findAll,
    findOne: findOne,
    findByBorrowerId: findByBorrowerId
  };
}

loanRepositoryFactory.$inject = ['$q'];

angular.module('scJanPozycz.loan', ['ng'])
  .factory('loanRepository', loanRepositoryFactory);
```

You can go quite far with such implementation, but it has some serious drawbacks. First off, it's quite some typing
involved. Then, it becomes more and more complicated to maintain relationships between your domain objects. Data
consistency is another concern. For example, a similar service `customerRepository` will contain customer data. Now you
see that this data is duplicated in the `loanRepository` service. Changing customer identifiers in one file and
forgetting to do so in the other will cause you app to display rubbish.

### DRY service implementation

```js
function loanRepositoryFactory(scEmbeddedDatabase) {

  var janpozyczdb = scEmbeddedDatabase.use('janpozyczdb');

  function findAll() {
    return janpozyczdb.queryForArray(
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
    );
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
    return janpozyczdb.queryForArray(
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
    );
  }

  return {
    findAll: findAll,
    findOne: findOne,
    findByBorrowerId: findByBorrowerId
  };
}

loanRepositoryFactory.$inject = ['scEmbeddedDatabase'];

angular.module('scJanPozycz.loan', ['ng', 'scEmbeddedDatabase'])
  .factory('loanRepository', loanRepositoryFactory);
```

It's important to realize how the aliases in the SELECT clause determine the returned data format. A proper use of the
`_` underscore character allows you to return some columns as the properties of an embedded object.

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

### Data module

I'd recommend writing a dedicated module for creating your embedded database and populating it with sample data in one
place.

```js
function createDatabase(scEmbeddedDatabase) {
  var janpozyczdb = scEmbeddedDatabase.use('janpozyczdb');

  janpozyczdb.executeSql('DROP TABLE CUSTOMER');
  janpozyczdb.executeSql('CREATE TABLE CUSTOMER(ID UNIQUE, FIRST_NAME, LAST_NAME)');
  janpozyczdb.batchUpdate('INSERT INTO CUSTOMER(ID, FIRST_NAME, LAST_NAME) VALUES (?, ?, ?)', [
    [10, 'Albert', 'Einstein'],
    [20, 'Eliza', 'Orzeszkowa'],
    [30, 'Henryk', 'Sienkiewicz']
  ]);

  janpozyczdb.executeSql('DROP TABLE LOAN');
  janpozyczdb.executeSql('CREATE TABLE LOAN(ID UNIQUE, AMOUNT, PERIOD, STATUS)');
  janpozyczdb.batchUpdate('INSERT INTO LOAN(ID, AMOUNT, PERIOD, STATUS) VALUES (?, ?, ?, ?)', [
    [10050, '1500 EUR', '30 DAYS', 'REQUESTED'],
    [10060, '1000 EUR', '15 DAYS', 'OVERDUE'],
    [20100, '500 EUR', '7 DAYS', 'ACTIVE']
  ]);

  janpozyczdb.executeSql('DROP TABLE CUSTOMER_LOAN');
  janpozyczdb.executeSql('CREATE TABLE CUSTOMER_LOAN(CUSTOMER_ID, LOAN_ID)');
  janpozyczdb.batchUpdate('INSERT INTO CUSTOMER_LOAN(CUSTOMER_ID, LOAN_ID) VALUES(?, ?)', [
    [10, 10050],
    [10, 10060],
    [20, 20100]
  ]);

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

## Does it really work?

So far I checked that this module works with Chrome and Safari web browsers.

![Chrome](/README/sc-embedded-database-chrome.png)

![Safari](/README/sc-embedded-database-safari.png)
