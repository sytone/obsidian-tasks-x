---
layout: default
title: Operators
nav_order: 3
parent: Queries - SQL
has_toc: false
---

# Operators

The following operators can be used in the SQL based queries.

Number

    +,-,*,/

String

    +

Logic

    AND, OR, NOT
    =, !=, <>, >, >=, <, <=

## Complex operators

SQL related

    WHERE v BETWEEN a AND b
    WHERE v NOT BETWEEN a AND b
    WHERE v IN (10,20,30)
    WHERE v NOT IN (SELECT status->indicator FROM tasks WHERE  )
    WHERE v >= ANY (20,30,40)

Access a child

The `->` operator is used to access nested data.

- `property->text` equals `property["text"]` in JavaScript
- `property->number` equals `property[number]` in JavaScript
- `property->functionName(args)` equals `property["functionName"](args)` in JavaScript

Object property

- `a -> b`
- `a -> b -> c`

Array member

- `a -> 1`
- `a -> 1 -> 2`

Calculated property name

- `a -> (1+2)`
- `a -> ("text2 + " " + "more")`

Functions

- `myTime -> getFullYear()`
- `s -> substr(1,2)`

Array members

    WHERE tags->(0) = "work"

JavaScript string functions can also be used

    WHERE description->length > 10
