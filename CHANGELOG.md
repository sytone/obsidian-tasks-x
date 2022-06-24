# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.4.1](https://github.com/sytone/obsidian-tasks-x/compare/2.4.0...2.4.1) (2022-06-24)

## [2.4.0](https://github.com/sytone/obsidian-tasks-x/compare/2.3.0...2.4.0) (2022-06-24)


### Features

* add ability to log with trace id ([678ef27](https://github.com/sytone/obsidian-tasks-x/commits/678ef2778378bf8f76d063054306da3bf20a6861))
* add hotkeys to specific task status types ([2a3ebf4](https://github.com/sytone/obsidian-tasks-x/commits/2a3ebf45c1941e74e4afb060996a4d7abe404a4c))
* add page details query block is executing on ([11da4ea](https://github.com/sytone/obsidian-tasks-x/commits/11da4eaf6a675b0f642099a2d76628da41e17d4c))
* add page details query block is executing on ([e1a7802](https://github.com/sytone/obsidian-tasks-x/commits/e1a7802145d5597556d35410bf790506cd75bcbb))
* update logging to make tracing of queries simpler ([f0af6dc](https://github.com/sytone/obsidian-tasks-x/commits/f0af6dcea38fb28b33663d33f0e706fe306d7251))


### Bug Fixes and Changes

* resolve casing issue with config folder ([cb08924](https://github.com/sytone/obsidian-tasks-x/commits/cb08924c4d935b7aa4b2e9112f581fed365ad349))
* resolve the casing oF the config folder ([4a99b1a](https://github.com/sytone/obsidian-tasks-x/commits/4a99b1aa344c1f014afa55f6746684ac701c0d93))


### Internal

* cleanup logging library and tasks services filename ([46d10f7](https://github.com/sytone/obsidian-tasks-x/commits/46d10f735525f1d700ffb660fcfedb61d9c55872))
* code cleanup and correct feature usage ([48aeda4](https://github.com/sytone/obsidian-tasks-x/commits/48aeda41369333f7fcc2dad4b76b864d72657a7a))
* implement faster header parsing saves a few ms per call ([9ecafac](https://github.com/sytone/obsidian-tasks-x/commits/9ecafac76c49ee318e5c1f1b0a0af80714798f98))
* only render markdown if links, saves over 5ms per call ([60e3d0c](https://github.com/sytone/obsidian-tasks-x/commits/60e3d0c20388d08c94ebecee7ef209b535f1f436))


### Documentation

* add callout logic ([b8864c5](https://github.com/sytone/obsidian-tasks-x/commits/b8864c50c68e9ccd3064fd429f5488b03df19e50))
* add more debug logging ([c9a66df](https://github.com/sytone/obsidian-tasks-x/commits/c9a66df23ec7282ec44cb5ca45b10dff2f12bfdf))
* add obsidian to md link step ([ec54622](https://github.com/sytone/obsidian-tasks-x/commits/ec54622f0dbb8fbcdb7941674c9ffcc9b8f65582))
* add proper callout conversion ([3772910](https://github.com/sytone/obsidian-tasks-x/commits/37729101a2c59cdbaa652476f099c8bb7b764323))
* add template for discord notification ([01d15f4](https://github.com/sytone/obsidian-tasks-x/commits/01d15f40cfe617adff123db0a35b8d921756484f))
* fix callout cleanup ([114da90](https://github.com/sytone/obsidian-tasks-x/commits/114da903800cf3e255f8ee54bdbf9743c6a3266b))
* hide documentation development readme ([3d19c7a](https://github.com/sytone/obsidian-tasks-x/commits/3d19c7affc8a76d0e6e25305b342d86065eefb91))
* remove page output and add grouping ([b0daab7](https://github.com/sytone/obsidian-tasks-x/commits/b0daab7f6482b0f49d9361e9c5f35806fa0144e4))
* shift to use obsidian vault with documentation ([8cea7d6](https://github.com/sytone/obsidian-tasks-x/commits/8cea7d61dc24f1c7339ee99f5f3a96506ed6ec69))
* update documenation and vault configuration ([622eed4](https://github.com/sytone/obsidian-tasks-x/commits/622eed43066b5f42b8a98645a71f9985ce02684e))
* update to use wiki links internally and rename action ([90f5a4a](https://github.com/sytone/obsidian-tasks-x/commits/90f5a4a53718c5c4d3255d489d9c061b328a8291))

## [2.3.0](https://github.com/sytone/obsidian-tasks-x/compare/2.1.0...2.3.0) (2022-06-11)


### Features

* add file as property of the task for quering ([eff7181](https://github.com/sytone/obsidian-tasks-x/commits/eff718153a118137651e001207ff1cb3b63de75c))
* separation of rendering logic from task model ([c289af9](https://github.com/sytone/obsidian-tasks-x/commits/c289af94b329633dba8cd8cde03b68704a39a2ed))


### Internal

* Add tests for urgency score ([#710](https://github.com/sytone/obsidian-tasks-x/issues/710)) ([0741ac1](https://github.com/sytone/obsidian-tasks-x/commits/0741ac11cbfbb13cbf28a6e5ecdc1f5d10bbbd04))
* Create priority filter class ([#706](https://github.com/sytone/obsidian-tasks-x/issues/706)) ([8048e26](https://github.com/sytone/obsidian-tasks-x/commits/8048e262685bdfae12abb6127d9531828fb2af67))
* Create tag/tags filter class ([#714](https://github.com/sytone/obsidian-tasks-x/issues/714)) ([251093f](https://github.com/sytone/obsidian-tasks-x/commits/251093f225a469cf9b976e3c6aa535d1729a0d64))
* Create text filter classes ([#705](https://github.com/sytone/obsidian-tasks-x/issues/705)) ([30a095b](https://github.com/sytone/obsidian-tasks-x/commits/30a095bf30331da12706f89187d4450f95e7db35))


### Documentation

* Fix 'How does Tasks handle status changes?' formatting ([#720](https://github.com/sytone/obsidian-tasks-x/issues/720)) ([17c9545](https://github.com/sytone/obsidian-tasks-x/commits/17c95451c01c43158e08fdc869d991af93113542))
* fix old references to Tasks X ([7e3cc89](https://github.com/sytone/obsidian-tasks-x/commits/7e3cc898d8b04a75ac948dd8b8a5c05d937d6fde))
* Indicate when 1.6.0 features were released ([#731](https://github.com/sytone/obsidian-tasks-x/issues/731)) ([3da6d12](https://github.com/sytone/obsidian-tasks-x/commits/3da6d1256510a8137afd38d7660ecd69d7239c0a))


### Bug Fixes and Changes

* fix rounding issue on days overdue ([39ae9fc](https://github.com/sytone/obsidian-tasks-x/commits/39ae9fc427cd9b5b0b40d32b43a45e92bd2065d0))
* Fix typo in error message for priority instruction. ([#707](https://github.com/sytone/obsidian-tasks-x/issues/707)) ([5608c02](https://github.com/sytone/obsidian-tasks-x/commits/5608c020e3af5f881e463785b67ceab8f616f67d))

## [2.2.0](https://github.com/sytone/obsidian-tasks-x/compare/2.1.0...2.2.0) (2022-06-11)


### Features

* add file as property of the task for quering ([eff7181](https://github.com/sytone/obsidian-tasks-x/commits/eff718153a118137651e001207ff1cb3b63de75c))
* separation of rendering logic from task model ([c289af9](https://github.com/sytone/obsidian-tasks-x/commits/c289af94b329633dba8cd8cde03b68704a39a2ed))


### Internal

* Add tests for urgency score ([#710](https://github.com/sytone/obsidian-tasks-x/issues/710)) ([0741ac1](https://github.com/sytone/obsidian-tasks-x/commits/0741ac11cbfbb13cbf28a6e5ecdc1f5d10bbbd04))
* Create priority filter class ([#706](https://github.com/sytone/obsidian-tasks-x/issues/706)) ([8048e26](https://github.com/sytone/obsidian-tasks-x/commits/8048e262685bdfae12abb6127d9531828fb2af67))
* Create tag/tags filter class ([#714](https://github.com/sytone/obsidian-tasks-x/issues/714)) ([251093f](https://github.com/sytone/obsidian-tasks-x/commits/251093f225a469cf9b976e3c6aa535d1729a0d64))
* Create text filter classes ([#705](https://github.com/sytone/obsidian-tasks-x/issues/705)) ([30a095b](https://github.com/sytone/obsidian-tasks-x/commits/30a095bf30331da12706f89187d4450f95e7db35))


### Documentation

* Fix 'How does Tasks handle status changes?' formatting ([#720](https://github.com/sytone/obsidian-tasks-x/issues/720)) ([17c9545](https://github.com/sytone/obsidian-tasks-x/commits/17c95451c01c43158e08fdc869d991af93113542))
* fix old references to Tasks X ([7e3cc89](https://github.com/sytone/obsidian-tasks-x/commits/7e3cc898d8b04a75ac948dd8b8a5c05d937d6fde))
* Indicate when 1.6.0 features were released ([#731](https://github.com/sytone/obsidian-tasks-x/issues/731)) ([3da6d12](https://github.com/sytone/obsidian-tasks-x/commits/3da6d1256510a8137afd38d7660ecd69d7239c0a))


### Bug Fixes and Changes

* fix rounding issue on days overdue ([39ae9fc](https://github.com/sytone/obsidian-tasks-x/commits/39ae9fc427cd9b5b0b40d32b43a45e92bd2065d0))
* Fix typo in error message for priority instruction. ([#707](https://github.com/sytone/obsidian-tasks-x/issues/707)) ([5608c02](https://github.com/sytone/obsidian-tasks-x/commits/5608c020e3af5f881e463785b67ceab8f616f67d))

## [2.1.0](https://github.com/sytone/obsidian-tasks-x/compare/2.0.14...2.1.0) (2022-06-06)


### Documentation

* move screenshots to site for linking ([3de5e97](https://github.com/sytone/obsidian-tasks-x/commits/3de5e9743f94409a58964f211133a303d60d1fcc))


### Bug Fixes and Changes

* move additional status type editing to modal ([e6f7037](https://github.com/sytone/obsidian-tasks-x/commits/e6f7037e2f15f4872b9caa1e2314dc0ee002cebf)), closes [#4](https://github.com/sytone/obsidian-tasks-x/issues/4)

### [2.0.14](https://github.com/sytone/obsidian-tasks-x/compare/v2.0.13...v2.0.14) (2022-06-04)

### [2.0.13](https://github.com/sytone/obsidian-tasks-x/compare/v2.0.12...v2.0.13) (2022-06-03)

### 2.0.12 (2022-06-02)


### Features

* add ability to sort by tag instance/index ([9c64527](https://github.com/sytone/obsidian-tasks-x/commits/9c645272b3f00f834b45cfade32eff1399dac893))
* add cancelled and in progress along with minimal supported tasks import ([de6cb0f](https://github.com/sytone/obsidian-tasks-x/commits/de6cb0fbb984a608c1c8ee5d989f4b2629b0b2a2))
* add feature flags to plugin ([9d27b5d](https://github.com/sytone/obsidian-tasks-x/commits/9d27b5d877c700c8b9b6b7642e699f2c6a5f06e8))
* add git attributes to force LF on windows ([d5976ba](https://github.com/sytone/obsidian-tasks-x/commits/d5976badea78c36964db5635dbba81752dd64221))
* add logging on mobile phone ([1c5f64b](https://github.com/sytone/obsidian-tasks-x/commits/1c5f64b40a21936c37e5221300586023a3fc7161))
* add query capabilities for status ([010f439](https://github.com/sytone/obsidian-tasks-x/commits/010f4394590d44b87070de3212b3383431198244))
* add raw query capability to make debugging simpler ([3454efa](https://github.com/sytone/obsidian-tasks-x/commits/3454efa3f43d3aa42dd60d15ae017b71819a37b6))
* Allow additional tasks states and filtering by states ([788e25e](https://github.com/sytone/obsidian-tasks-x/commits/788e25e93117805a6967ca6c864163b1e88be968)), closes [#666](https://github.com/sytone/obsidian-tasks-x/issues/666)
* allow tag query to be hashless ([1bb8f9f](https://github.com/sytone/obsidian-tasks-x/commits/1bb8f9fe27ec67812b3e4cc3e2f6c1d7f5f9b293))
* disregard the global tag ([f2104c9](https://github.com/sytone/obsidian-tasks-x/commits/f2104c98faed4cfa9a559a303a7d21efb085e0e2)), closes [#632](https://github.com/sytone/obsidian-tasks-x/issues/632)
* enable moment support in alasql ([fa9e324](https://github.com/sytone/obsidian-tasks-x/commits/fa9e32441458f1663776d6c8c62c1d6c84ac467a))
* mobile support and move to node 16 ([629541e](https://github.com/sytone/obsidian-tasks-x/commits/629541e4403196a07bca1322367cc7b4092acbf8))
* move to own logging to support mobile ([9404d52](https://github.com/sytone/obsidian-tasks-x/commits/9404d5297207294647704835139e08e0d3a5a3c6))
* update logging levels ([b771787](https://github.com/sytone/obsidian-tasks-x/commits/b771787cc355359c3abb8625f908dac3db68e5ce))
* update query language, add tests, make hash optional and query case insensative ([d8a95b0](https://github.com/sytone/obsidian-tasks-x/commits/d8a95b0b7c45fb44d1bb9bb0b98816abd91a7e1a))


### Internal

* add tests to validate substring ([547f776](https://github.com/sytone/obsidian-tasks-x/commits/547f7765de41ff29bb069f3d0e2f361f524186d5))
* change queryx to querysql ([556d0d8](https://github.com/sytone/obsidian-tasks-x/commits/556d0d8792697998cbf03e7bdcdba052d5e505ee))
* chect to see if global tag is not found in query ([9716007](https://github.com/sytone/obsidian-tasks-x/commits/971600712779fdbeab2071fced17ea24de66c56a))
* create IQuery interface for query engine and add new folder for future query engine ([#699](https://github.com/sytone/obsidian-tasks-x/issues/699)) ([a13db33](https://github.com/sytone/obsidian-tasks-x/commits/a13db33a3969a6e2e404b6314b96dd35ac9d4feb))
* move querysql to correct folder ([2369885](https://github.com/sytone/obsidian-tasks-x/commits/2369885b11b9d027bd5254c89e1fb6f45352400b))
* refactor tag tests out and make them data driven ([75eba71](https://github.com/sytone/obsidian-tasks-x/commits/75eba71a4c01a941b07cc79198f7090613a5664e))


### Documentation

* cleanup readme ([4fb6bd2](https://github.com/sytone/obsidian-tasks-x/commits/4fb6bd2c8072f6bc11d876556ad853e819bff386))
* linit update ([ee09a36](https://github.com/sytone/obsidian-tasks-x/commits/ee09a368e64777f90761aacd86d0a0321cc4d464))
* move/update docs docker scripts ([60903ae](https://github.com/sytone/obsidian-tasks-x/commits/60903aed3370e4b8434af6194642ca0933205771))
* update filter documentation on the tag query ([a3964f7](https://github.com/sytone/obsidian-tasks-x/commits/a3964f78846c4325adc99be3efc6c893933b47a3))
* update grammar based issue and sorting description for tags ([b2ace95](https://github.com/sytone/obsidian-tasks-x/commits/b2ace95dec86d5de8c1c0e440e3dd7b5eb314ace))
* update the url to point to fork ([6a3ac4e](https://github.com/sytone/obsidian-tasks-x/commits/6a3ac4eed04dec02a735026bff3723e6fa1ef81a))


### Bug Fixes and Changes

* cleanup engine referencing ([59c4b7c](https://github.com/sytone/obsidian-tasks-x/commits/59c4b7cda14d816e45ad73e69606074f65396058))
* fix logging and task toggle ([387100e](https://github.com/sytone/obsidian-tasks-x/commits/387100e6a4274ff0aba0a564afb7a8e07e94c054))
* No longer crash when toggling a recurring task without any date ([#597](https://github.com/sytone/obsidian-tasks-x/issues/597)) ([0fd369f](https://github.com/sytone/obsidian-tasks-x/commits/0fd369f0c74eb2835753c40c6b73b09a08d95a3b))
* resolve remaining comments and revert markdown lint changes ([67e97c6](https://github.com/sytone/obsidian-tasks-x/commits/67e97c6df51cb0df15bc0e4091ed3eb7643cffb9))
* resolved issues raised in PR. ([4b88b4a](https://github.com/sytone/obsidian-tasks-x/commits/4b88b4a605fafdca9fd4a9b478d3f88deb8ed28b))
* Tasks now has basic support for block quotes ([f33cb07](https://github.com/sytone/obsidian-tasks-x/commits/f33cb0700b09d9c71da5de8de781c1f82512ece1)), closes [#371](https://github.com/sytone/obsidian-tasks-x/issues/371)
* update chrono and global filter logic ([100eb97](https://github.com/sytone/obsidian-tasks-x/commits/100eb97d4f9fe0b2c7393362c60b45ece593dc98)), closes [#5](https://github.com/sytone/obsidian-tasks-x/issues/5)
* Update li rendering to match obsidian ([f58186a](https://github.com/sytone/obsidian-tasks-x/commits/f58186ac912ed24281e2eee208ae21390cf57675))
* update the settings management process ([2211fee](https://github.com/sytone/obsidian-tasks-x/commits/2211feecae4236da290a81c3b14d061984a86801))
