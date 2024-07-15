# Updating the project

I'm writing down what I updated when I started to work on this project again
just before my X-mas holidays before our Sunday AEMR game on 2021-12-19.

Update: still going in ~~2023~~ 2024 :)

## Update to current python: DONE

On my laptop, this means updating my python with `pyenv` from `brew`. Target is to use Python 3.10, as that is the current one.

## Update to current Django: DONE

Update to Django 2.2 went relatively painlessly. Newest versions start to require PostgreSQL 10 and later, which causes an issue as current server is old and running outdated Debian version. 

- [X] Update to current package layout, to remove clutter from project root directory.

## Nuked Pipfile: DONE

It was only causing problems. In case package pinning outside of requirements.txt is needed, study [Poetry](https://python-poetry.org).

## Update all packages: DONE 
## Move to new server/Lambda/etc

Dockerizing the deployment for testing and easy of development for other people is the first step. From here, modifying the environment to be also deployable in production in containers is good continuation, as that will reduce the dependency to the host environment, be it in AWS or UpCloud.

In production, the docker web servers need to handle crashes gracefully, enter [restart policies](https://docs.docker.com/config/containers/start-containers-automatically/).

The server needs to have Let's Encrypt running for HTTPS certs, as it is currently.

DONE: Moved to a new server, more cost effective than using EC2/RDB etc

## staticfiles and uploads to S3: POSTPONED
https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html

DONE: new server

## Use src layout for package: DONE

Django has moved settings.py etc. to one level above the base directory. That change is a good starting point.

## Updating to current React etc: DONE

`npm update` and `npm audit fix --force` updated `package.json` and friends.

I'm left with a bunch of warnings about anti-patterns in React usage, those 
need to be sorted also.

### React 18: DONE

`react-dom/test-utils` starts to generate warnings. It is being retired in favor of [Testing Library](https://testing-library.com/docs/react-testing-library/).

Biggest problem is `TestUtils.renderIntoDocument`. Current rage seems to be to use Testing Library and Mock Service Workers.

First tests done with `add-weapon-control-tests.js` and `stat-block-character-edge-tests.js`.

Having tests on top of MSW and StatBlock seems to be almost like a system-level integration test. Very nice!

### React-widgets

This library seems to be mostly stale. It is causing warnings due to use of `findDOMNode` from inside the library. I use the widgets mostly because of the `Combobox`, but similar are available in other packages, and even writing one based on Bootstrap should not be very hard.

## Class components to React Hooks?

https://react.dev/reference/react/Component#alternatives

Class components are `legacy` and I expect support for them to eventually disappear.

At least `useEffect()` hook was not very easy to use with the class components.

First stab at this is in the `ModificationButton.js`. New components should use function based style and be implemented with TypeScript as applicable.

## TODO: JavaScript to TypeScript or whatever is the latest rage

https://webpack.js.org/guides/typescript/

## Fix primary keys for models

* `Skill`
* `WeaponTemplate`
* `RangedWeaponTemplate`
* `BaseFirearm`

Apparently needs to be done at one go to make it possible to run tests with
SQLite3 backend. Postgres would probably work ok. Will require changes to the
REST endpoints at the same go.

* Add new models with "normal" id fields
* Add fields mirroring old relations to old models to contain the new objects
* After copying the old objects to new  and populating the foreign keys and many-to-many fields, enforce the same non-nullable constraints on the new fields
* Remove the old fields to the old models
* Rename the new fields to the old names
* Remove orphan old models
* Rename new models to the old names
* Fix REST interfaces, either by using optional "name" field lookup in conjunction with primary key lookup, or by just making the transition at the same go
