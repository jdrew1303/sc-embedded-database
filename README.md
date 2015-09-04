sc-embedded-sql-database
========================

## WTF?

### Assumptions

I assume that you're:

1. a frontend developer (including hipsters)
2. using AngularJS
3. getting dizzy whenever you hear the words **backend**, **transaction**, **ACID**, **scalable**, or similar
4. familiar with SQL
5. displaying some meaningful data in you next kick-ass application
6. lazy and want to transition from POC to a production ready code real quick

### Example

Imagine that we're in the customer lending world domain trying to do a POC and convince investors
to support your project. A customer is in a need to borrow some money fast. Therefore you app has
to track all borrowers and their personal/contact data as well as loan requests.

They teach in kindergarten that you may go with the following relational model to store the data.

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

