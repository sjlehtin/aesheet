## Version 0.10.0 -- 2023-06-21

### Added

* Allow ignoring cost for edges. This makes it possible to acquire edges (mostly flaws) during play without XP ramifications.
* Select `normal` quality as the default for melee weapons.
* Use a standard package layout. This allows to install the sheet from packages without cloning the source code.

### Changed

* Upgraded python packages to current versions.

### Removed

* `git log` is not used as the dynamic ChangeLog anymore; it is not available when installing from packages.

## Version 0.9.1 -- 2019-08-09

Scope weights are calculated to total weight.

Severed link between FirearmAddOns and Scopes; the link was originally
accidental due to the use of direct concrete inheritance between the
classes.

## Version 0.9 -- 2019-08-05

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