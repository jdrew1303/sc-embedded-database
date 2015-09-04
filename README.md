sc-embedded-sql-database
========================

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

So they teach in kindergarten that you may go with the following [relational model](https://en.wikipedia.org/wiki/Relational_model)
to store the data.

#### CUSTOMER

The `CUSTOMER` table holds basic customer details.

| ID (PK) | FIRST_NAME | LAST_NAME  |
|--------:|------------|------------|
|      10 | Albert     | Einstein   |
|      20 | Eliza      | Orzeszkowa |

#### LOAN

The `LOAN` table holds loan details.

| ID (PK)    | AMOUNT   | PERIOD  | STATUS    |
|-----------:|---------:|--------:|-----------|
| 10050      | 1500 EUR | 30 DAYS | REQUESTED |
| 10060      | 1000 EUR | 15 DAYS | OVERDUE   |
| 20100      |  500 EUR |  7 DAYS | ACTIVE    |

> **Note** The example is intentinally contrived. Stuffing the amount
> as VARCHAR in your database is probably not the best idea even though
> I've seen such things in production code.

#### CUSTOMER_LOAN

The `CUSTOMER_LOAN` table holds zero to many loans taken by a customer.

| CUSTOMER_ID (FK) | LOAN_ID (FK) |
|-----------------:|-------------:|
|               10 |        10050 |
|               10 |        10060 |
|               20 |        20100 |

Having done the domain modeling you can start messing up with JavaScript and end up with the following AngularJS
[service](https://docs.angularjs.org/guide/services) for fetching loans:

```js
angular.module('scJohnBorrower.loan', ['scEmbeddedDatabase'])
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

#### DRY

```js
angular.module('scJohnBorrower.loan')
   .factory('loanRepository', loanRepositoryFactory);

loanRepositoryFactory.$inject = ['scEmbeddedDatabase'];

function loanRepositoryFactory(scEmbeddedDatabase) {
   function findAll() {
      return scEmbeddedDatabase.executeSql(
         'SELECT L.ID AS ID, L.AMOUNT AS AMOUNT, ' +
         'C.ID AS BORROWER_ID, C.FIRST_NAME AS BORROWER_FIRSTNAME, C.LAST_NAME AS BORROWER_LASTNAME ' +
         'FROM LOAN AS L' +
         'INNER JOIN CUSTOMER_LOAN CL ON L.ID = CL.LOAN_ID ' +
         'INNER JOIN CUSTOMER C ON CL.CUSTOMER_ID = C.ID');
   }

   function findOne(id) {
      return scEmbeddedDatabase.executeSql(
         'SELECT L.ID AS ID, L.AMOUNT AS AMOUNT, ' +
         'C.ID AS BORROWER_ID, C.FIRST_NAME AS BORROWER_FIRSTNAME, C.LAST_NAME AS BORROWER_LASTNAME ' +
         'FROM LOAN AS L' +
         'INNER JOIN CUSTOMER_LOAN CL ON L.ID = CL.LOAN_ID ' +
         'INNER JOIN CUSTOMER C ON CL.CUSTOMER_ID = C.ID' +
         'WHERE L.ID = ?', [id]);
   }

   function findByBorrowerId(borrowerId) {
      return scEmbeddedDatabase.executeSql(
         'SELECT L.ID AS ID, L.AMOUNT AS AMOUNT, ' +
         'C.ID AS BORROWER_ID, C.FIRST_NAME AS BORROWER_FIRSTNAME, C.LAST_NAME AS BORROWER_LASTNAME ' +
         'FROM LOAN AS L' +
         'INNER JOIN CUSTOMER_LOAN CL ON L.ID = CL.LOAN_ID ' +
         'INNER JOIN CUSTOMER C ON CL.CUSTOMER_ID = C.ID' +
         'WHERE C.ID = ?', [borrowerId]);
   }

   return {
      findAll: findAll,
      findOne: findOne,
      findByBorrowerId: findByBorrowerId
   };
}
```

It's important to realize how the aliases in the SELECT clause determine the returned data format.
A proper use of the `_` underscore character allows you to return some columns as the properties of
an embedded object.

For example, the following SELECT clause:

```sql
SELECT L.ID AS ID, L.AMOUNT AS AMOUNT,
       C.ID AS BORROWER_ID, C.FIRST_NAME AS BORROWER_FIRSTNAME, C.LAST_NAME AS BORROWER_LASTNAME
```

when passed to the `scEmbeddedDatabase#executeSql` function will return the following JSON:

```js
[
   {id: 10250, amount: 1600, borrower: {id: 1, firstName: 'Albert', lastName: 'Einstein'}},
   {id: 10240, amount: 1400, borrower: {id: 2, firstName: 'Eliza', lastName: 'Orzeszkowa'}}
]
```
