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
