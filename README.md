# Obsidian Tasks SQL Powered

> Task management for the [Obsidian](https://obsidian.md/) knowledge base. With **SQL** Powers

[![Version][version-shield]][version-url]
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![Downloads][downloads-shield]][downloads-url]

## 📑[Documentation](https://sytone.github.io/obsidian-tasks-x/)

This is a fork of the Tasks plugin for obsidian and will be kept in sync with it where possible. This for provides extended query capabilities and long term should be merged back into the main plugin. Until then enjoy the power of SQL.

Here are some examples of what can be done with this plugin:

- `WHERE status->indicator = ' ' AND  moment()->[format]('YYYY-MM-DD') = moment(dueDate)->[format]('YYYY-MM-DD')`
- `WHERE status->indicator = ' ' AND moment(dueDate)->isBetween(moment()->startOf('day').subtract(1, 'days'), moment()->startOf('day').add(14, 'days'))`
- `WHERE status->indicator = 'x' AND precedingHeader LIKE '%tasks%'`
- `WHERE status->indicator = ' ' AND moment(dueDate)->[format]('YYYY-MM-DD') = '2021-04-09' AND path LIKE '%GitHub%'`
- `WHERE description LIKE '%waiting%' OR description LIKE '%waits%' OR description LIKE '%wartet%'`

And much much more is possible, go explore and share!

Track tasks across your entire vault. Query them and mark them as done wherever you want. Supports due dates, recurring tasks (repetition), done dates, sub-set of checklist items, and filtering.

_You can toggle the task status in any view or query and it will update the source file._

---

For changes in each release, please check the releases page: <https://github.com/sytone/obsidian-tasks-x/releases>

---

## Screenshots

- _All screenshots assume the [global filter](#filtering-checklist-items) `#task` which is not set by default (see also [installation](#installation))._
- _The theme is [Obsidian Atom](https://github.com/kognise/obsidian-atom)._

![ACME Tasks](https://github.com/sytone/obsidian-tasks-x/raw/main-tasks-sql/resources/screenshots/acme.png)
The `ACME` note has some tasks.

![Important Project Tasks](https://github.com/sytone/obsidian-tasks-x/raw/main-tasks-sql/resources/screenshots/important_project.png)
The `Important Project` note also has some tasks.

![Tasks Queries](https://github.com/sytone/obsidian-tasks-x/raw/main-tasks-sql/resources/screenshots/tasks_queries.png)
The `Tasks` note gathers all tasks from the vault and displays them using queries.

![Create or Edit Modal](https://github.com/sytone/obsidian-tasks-x/raw/main-tasks-sql/resources/screenshots/modal.png)
The `Tasks: Create or edit` command helps you when editing a task.

## Installation

Follow the steps below to install Tasks.

1. Search for "Tasks X" in Obsidian's community plugins browser
2. Enable the plugin in your Obsidian settings (find "Tasks X" under "Community plugins").
3. Check the settings. It makes sense to set the global filter early on (if you want one).
4. Replace the "Toggle checklist status" hotkey with "Tasks: Toggle Done".
    - I recommend you remove the original toggle hotkey and set the "Tasks" toggle to `Ctrl + Enter` (or `Cmd + Enter` on a mac).

### From BRAT

To install a pre-release, download and enable the [Obsidian42 BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin, add the beta repository `sytone/obsidian-tasks-x`, and then have BRAT check for updates.

### Manual installation

1. Download the latest [release](https://github.com/sytone/obsidian-tasks-x/releases/latest)
2. Extract the obsidian-tasks-x-plugin folder from the zip to your vault's plugins folder: `{vault}/.obsidian/plugins/`
   Note: On some machines the `.obsidian` folder may be hidden. On MacOS you should be able to press `Command+Shift+Dot` to show the folder in Finder.
3. Reload Obsidian
4. If prompted about Safe Mode, you can disable safe mode and enable the plugin.

## User Documentation

For user documentation, please check [https://sytone.github.io/obsidian-tasks-x/](https://sytone.github.io/obsidian-tasks-x/).

## Development

Clone the repository, run `yarn` to install the dependencies, and run `yarn dev` to compile the plugin and watch file changes.

## Donations

The plugin is completely free to use. If you love it very much and want to pay it forward, please consider donating to an organization of your choice.
Two example organizations that you could consider donating to are the Wikimedia Foundation and the Electronic Frontiers Foundation:

1. [Support the Wikimedia Foundation](https://wikimediafoundation.org/support/)
2. [Support EFF](https://supporters.eff.org/donate/join-eff-today)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/sytone/obsidian-tasks-x.svg?style=for-the-badge
[contributors-url]: https://github.com/sytone/obsidian-tasks-x/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/sytone/obsidian-tasks-x.svg?style=for-the-badge
[forks-url]: https://github.com/sytone/obsidian-tasks-x/network/members
[stars-shield]: https://img.shields.io/github/stars/sytone/obsidian-tasks-x.svg?style=for-the-badge
[stars-url]: https://github.com/sytone/obsidian-tasks-x/stargazers
[issues-shield]: https://img.shields.io/github/issues/sytone/obsidian-tasks-x.svg?style=for-the-badge
[issues-url]: https://github.com/sytone/obsidian-tasks-x/issues
[license-shield]: https://img.shields.io/github/license/sytone/obsidian-tasks-x.svg?style=for-the-badge
[license-url]: https://github.com/sytone/obsidian-tasks-x/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/othneildrew
[product-screenshot]: images/screenshot.png
[version-shield]: https://img.shields.io/github/package-json/v/sytone/obsidian-tasks-x.svg?style=for-the-badge
[version-url]: https://github.com/sytone/obsidian-tasks-x/releases/latest

[downloads-shield]: https://img.shields.io/github/downloads/sytone/obsidian-tasks-x/total.svg?style=for-the-badge
[downloads-url]: https://github.com/sytone/obsidian-tasks-x
