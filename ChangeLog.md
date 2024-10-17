## Unreleased

### Added

* Display key modifications to stats from armor.
* Added note about Target-I penalty when changing targets in sweep fire.

### Changed

* Take new firearms in CC rule into use. The whole rule has been revamped.
* Stamina damage controls are now "Add" and "Heal", it now adds to the existing damage instead of directly changing the backing value. This is more intuitive and removes the need for the player to calculate the damage.
* When changing armor, the sheet uses the last selected template and quality of the current armor as default values. This should make it easier to apply, say, melting plague quality effects and experiment stat changes with and without armor.
* Scope removal done by selecting "Remove scope" from the dropdown instead of a button, frees space in the layout.

### Fixed

* Existing weapons and ranged weapons correctly show skill checks. This was broken in the skill refactoring.
* Fixed running under Docker.
* Fixed scope perks which were broken in the skill and edge refactoring.

## [0.25.0] - 2024-10-01

### Changed

* Ammunition property `cartridge_weight` is now used as the full weight if given. Bullet weight is not added anymore.
* If armor is powered, armor weight is ignored in weight calculations.
* Updated `npm` dependencies.

### Fixed

* Fixed issue with use type when adding firearms. Now newly added firearms will correctly be treated with "full" use type.

## [0.24.0] - 2024-09-05

### Added

* Added search functionality for sheets in admin.
* Added one-handed use penalty for firearms, big pistols and such are hard to aim with only one hand.
* Added overall damage reduction to armor.
* Added attribute `autofire_only` to firearms.
* Added optional `cartridge_weight` for ammunition, which will be used instead of heuristics for ammunition weight if defined.

## [0.23.0] - 2024-08-08

### Added

* Sense table sense checks have breakdowns as tooltips.
* Allow fractional damage from weapon and quality, rounded down last.
* Added firearms in close combat. Combat transients now has a "in close combat" toggle, which will change firearms to CC mode.

### Changed

* Skills have boolean attributes on whether they are affected by armor skill mods. This makes it easier to add skills that are affected by armor.
* Range effect rule changes as per JW 2024/08. Target initiative affected by vision INT check instead of weapon range. Changes not yet completely done for ranged weapons and close combat not reviewed yet. 

## [0.22.0] - 2024-07-19

### Changed

* Skills and weapons to have standard integer primary keys instead of their names in the backend. This was a huge effort that will pay dividends in the future in ease of renaming skills and items. In general, the sentiment is to use built-in characteristics of skills and edges instead of their names when calculating effects.

### Added

* Added damage point calculation from armor quality.
* Added reordering controls to sheet set.
* Added confirmation dialog when deleting a sheet in sheet set.
* Added handling for wound effects for wounds with damage greater than the location threshold.
* Added movement rate calculation based on gravity.
* Implement powered armors, with suspended weight, with possibility to add Power Armor skill.
* Sweep fire range penalties are doubled.
* Add XXXL and Extreme ranges, provided that the scope or the user has high enough Acute Vision effect.
* Added admin list edit for RangedWeaponTemplates.
* Use range from combat transients in advancing initiatives of the normal sheet as well.
* Added natural weapons to close combat. Calculate durability dynamically from edges Hardened Skin and Toughness.

### Fixed

* Sheet set backend rejects if the same sheet is attempted to be added to the set multiple times.
* Sheet set frontend filters out sheets already in the set to avoid errors.
* Improved layout on sheet sets.
* Fixed issues when removing and deleting sheets from sheet set.
* Fixed DR calculation based on quality.
* Clear sheet stamina damage on sheet clone.
* Fixed power armor positive FIT modifier.
* Fixed sheet set rendering in case a private sheet was included by accident or permissions later changed.
* Fixed backend to respect character private setting. Private sheets that do not belong to the user are filtered out from the results.
* Acute vision should have full effect in Clear (darkness detection level 0) situations.
* Improved combat transient usability. Made the handle wider and it will change color with non-default settings.
* Make damage and current penalties more prominent in the sheet display.
* Fix skill check calculation with defaulted handguns check.

## [0.21.0] - 2024-07-03

### Added

* Added check breakdowns for the skill checks in burst and sweep fire for firearms.
* Fixed erroneous positive advancing initiatives in case character MOV dropped to zero or below.
* Added sheet sets for managing multiple sheets (characters) in a single page.
* Added a status indication background color to the sheet.
* Implemented Pain Resistance edge.

### Changed

* Moved wounds and stamina damage to Sheet. This allows Sheet to be used as part of a set of sheets without adding another indirection.

### Fixed

* Fixed an obvious bug in armor dr calculation when calculating with qualities.

## [0.20.0] - 2024-06-28

### Added

* Better admin controls for ArmorTemplates, ArmorQualities, and EdgeLevels.

## [0.19.0] - 2024-06-28

### Added

* Added possibility to specify lethality and damage reduction to edge levels. This allows implementing Hardened Skin edge.

### Fixed

* {Acute,Poor} Hearing was mistakenly used in place of {Acute,Poor} Smell and Taste.

## [0.18.0] - 2024-06-27

### Changed

* Gravity rules updated according to rules change on 2024-06-05. Movement rates and recoil are not yet implemented. See SkillHandler.js for full status of implementation.
* If ArmorQuality has DR set to zero, total armor DR will be calculated by a formula from the lethality reductions in the armor at that location, if any.

## [0.17.0] - 2024-06-01

### Added

* Added a "Combat transients" side drawer to contain ephemeral combat stats that are often changed during combat. It allows those stats to stay stationary while perusing the rest of the sheet. It can be dismissed if not needed.
* Added a control to change the gravity. It currently affects encumbrance on high gravity and adds a REF-penalty on low gravity. REF-penalties due to gravity can be offset by having the relevant skill (High/Low-G maneuver).
* Gravity affects also ranged weapons range and jumping distances. For jumping, high gravity has a large effect, due to increased encumbrance causing FIT/REF penalty, and the gravity directly reducing the distances. 

### Changed

* `Tailing / Shadowing` (to be renamed) affects surprise check and `Search` (to be renamed) affects other sense checks.
* AC penalty also affects sense and surprise checks.
* Moved range controls to the combat transients sidebar.

### Fixed

* Default to normal quality when adding armor and helmets.
* Sheet no longer uses old ReactDOM TestUtils in the tests, it is now using mostly Testing Library and Mock Service Worker for testing the sheet functionality.

## [0.16.1] - 2024-05-21

### Changed

* Change character notes to use bootstrap buttons and allow activating edit by clicking on the textarea.

## [0.16.0] - 2024-05-21

### Added

* Adding and removing edges will generate character log entries.
* Added easier admin interface for character skills and edges.

### Changed

* Tweaked wound penalty indications to show explicitly the stats that are negative due to excess AA penalties.
* Changed default skill layout according to JW's 2024 update.

## [0.15.1] - 2023-07-18

### Fixed

* Tweaked magazine display.

## [0.15.0] - 2023-07-18

### Added

* Added breakdown for encumbrance of carried equipment.
* Added damage thresholds to hit locations. Massive wounds exceeding threshold cause stamina damage.
* Allow loading magazines.

### Fixed

* Penalties for wounds in a hit location are capped according to the rules.

## [0.14.0] - 2023-07-16

### Added

* Added magazine management for firearms and added encumbrance from carried ordnance.
* Added use type for firearms. You can now add two pistols for your characters for an authentic John Woo -style pistols akimbo experience.

### Fixed

* CC Weapon size now factored in to the weight of the weapon.

## [0.13.0] - 2023-07-11

### Added

* Added skill check breakdown in skill table and weapon checks.
* Added stat breakdown in the stats table.
* Added field `tech_level` to Effect, from where it is now added to ArmorSpecialQuality and WeaponSpecialQuality. No current campaigns have any of these objects, so no backwards compatibility issues should arise.
* Added field `magazine_size` to BaseFirearm, preparing for handling spent ammo in the sheet.
* Added list edit controls for Ammunition and BaseFirearms to make it easier to compare and modify firearms en masse.

### Changed

* Simplified inventory user interface.

### Fixed

* Fixed issue with auxiliary stats in combat (i.e., FIT in ranged combat, INT in CC) where low auxiliary stat was ignored. Reading the rules a low stat can clearly incur penalties.

### Removed

* Removed CharacterLogEntry edit from the admin. Never used and only clutters the list of models.

## [0.12.0] - 2023-07-06

### Added

* Improved the Django Admin interface to make it simpler to create alternate versions of weapons and armors with new tech levels.
* Render Tech levels in Django Admin Campaign view, making it simpler to compare campaigns.
* BaseFirearm, WeaponTemplate, ArmorTemplate, and many others to support "Save as new", tech level filtering and searching.

### Removed

* Due to new additions, support in Django 2.2 no longer passes tests and is removed.

## [0.11.0] - 2023-07-06

### Added

* Compatibility with latest Django versions (current release 4.2).
* Added inline editor for the firearm ammunition types in the admin interface.
* Highlight skills missing pre-requisites in the skill list more prominently.

### Changed

* Use an explicit Caliber model for BaseFirearm instead of just a string type. This simplifies and makes the behavior more standard.
* Tweaked admin interface filters to make objects easier to browse.
* `react-icons/go` (Github Octicons) used instead of obsoleted `react-octicon`
* Updated rest of the `npm` packages. There should be no more outdated dependencies.

## [0.10.0] - 2023-06-21

### Added

* Allow ignoring cost for edges. This makes it possible to acquire edges (mostly flaws) during play without XP ramifications.
* Select `normal` quality as the default for melee weapons.
* Use a standard package layout. This allows to install the sheet from packages without cloning the source code.

### Changed

* Upgraded python packages to current versions.

### Removed

* `git log` is not used as the dynamic ChangeLog anymore; it is not available when installing from packages.

## [0.9.1] - 2019-08-09

Scope weights are calculated to total weight.

Severed link between FirearmAddOns and Scopes; the link was originally
accidental due to the use of direct concrete inheritance between the
classes.

## [0.9.0] - 2019-08-05

Added scopes, with possibility of assigning "perks", or edge levels, to
the scopes. As a classic example, this allows creating of night vision
and telescopic scopes. The edge levels will be counted towards the
skill checks with the weapon in question.

Allowing specifying range to shoot at with firearms.

Fixed sheet layout to hopefully be more responsive with smaller screens.

Upgraded all top-level npm packages, markedly React, react-bootstrap,
webpack and a bunch of testing libraries.

### Bugfixes

Toughness now correctly counts as two points of body.
