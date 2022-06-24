---
layout: default
title: Columns
nav_order: 1
parent: Queries - SQL
has_toc: false
---

# Columns / Properties

The following columns or properties are available to be used in the WHERE clauses when writing the SQL queries. The SQL engine also allows you to access the columns or properties children. For the remiander of this document the term column will be used to refernce a property of the task that may or may not have sub properties you can access

## Available Columns

| Column Name                 | Description                                                                         | Type             |
| --------------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| status                      | The status object holds the current and next indicator and a description.           | Status Object    |
| status->indicator           | The value between the square brackets. ('x', ' ', '-', '/', etc)                    | string           |
| status->name                | The display name for the status. ('Done', 'Todo', 'Cancelled', 'In Progress')       | string           |
| status->nextStatusIndicator | The next indicator to be used when clicked on.  ('x', ' ', '/', etc)                | string           |
| description                 | The description of the task.                                                        | string           |
| path                        | The path to the note the task is in.                                                | string           |
| file                        | The TFile object in Obsidian.                                                       | TFile Object     |
| precedingHeader             | The heading that the task is under                                                  | string           |
| priority                    | The priority of the task. This has to be treated like a string ('1', '2', '3', '4') | string           |
| startDate                   | Taken from the task string, matches `🛫 yyyy-mm-dd`. No time spcified.               | Date             |
| scheduledDate               | Taken from the task string, matches `⏳ yyyy-mm-dd`. No time spcified.               | Date             |
| dueDate                     | Taken from the task string, matches `📅 yyyy-mm-dd`. No time spcified.               | Date             |
| createdDate                 | Taken from the task string, matches `TBD yyyy-mm-dd`. No time spcified.             | Date             |
| doneDate                    | Taken from the task string, matches `✅ yyyy-mm-dd`. No time spcified.               | Date             |
| recurrence                  | This uses logic from [jakubroztocil/rrule](https://github.com/jakubroztocil/rrule)  | RecurrenceRecord |
| blockLink                   |                                                                                     | string           |
| tags                        | [];                                                                                 | string[]         |

## Column Types

Each column type can have additional properties and actions taken if it is not just a string. These additional actions are highlighted below.

### String Types

This is the simplest type and will work as you expect for strings. As you can access JavaScript functions you can also use all the Javascript functions alongside the SQL ones.

### Date Types

When using the date columns you can use JavaScript commands in the WHERE clause. The example below will pull all tasks that were done in 2021. To also assist in working with the date objects moment is available in your queries. For details on how to use moment please use the [Moment.js Docs](https://momentjs.com/docs/). Remember to replace the `.` with `->` if accessing a function or property.

````markdown
```task-sql
WHERE ((dueDate->getUTCFullYear() = 2021 AND status->indicator = 'x') OR (dueDate->getUTCFullYear() = 2022 AND status->indicator = ' ')) AND description LIKE '%#%'
```
````

Look at the [SQL Compatibility](https://github.com/AlaSQL/alasql/wiki/SQL%20keywords) table to see what SQL commands are supported.

### RecurrenceRecord Object

You can access properties by using `recurrence->property_name`. The table below lists the vlid properties and uses.

| Name          | Description                                                                                     | Type    |
| ------------- | ----------------------------------------------------------------------------------------------- | ------- |
| rrule         | Reoccurance string following the iCal RFC                                                       | string  |
| baseOnToday   | If true the reoccurance is based on the day you complete the task. If False the `referenceDate` | boolean |
| referenceDate | Date to base the reoccurance off is `basedOnToday` is false.                                    | Date    |
| startDate     | See [[3-getting-started/recurring-tasks#Priority of Dates\|Priority of Dates]]                  | Date    |
| scheduledDate | See [[3-getting-started/recurring-tasks#Priority of Dates\|Priority of Dates]]                  | Date    |
| dueDate       | See [[3-getting-started/recurring-tasks#Priority of Dates\|Priority of Dates]]                  | Date    |

Object Type Details

```typescript
export type RecurrenceRecord = {
    rrule: string;
    baseOnToday: boolean;
    referenceDate: Date | null;
    startDate: Date | null;
    scheduledDate: Date | null;
    dueDate: Date | null;
};
```
