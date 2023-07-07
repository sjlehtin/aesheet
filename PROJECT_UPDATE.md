# Updating the project

I'm writing down what I updated when I started to work on this project again
just before my X-mas holidays before our Sunday AEMR game on 2021-12-19.

Update: still going in 2023 :)

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

### React 18

`react-dom/test-utils` starts to generate warnings. It is being retired in favor of [Testing Library](https://testing-library.com/docs/react-testing-library/).

Biggest problem is `TestUtils.renderIntoDocument`. Current rage seems to be to use Testing Library and Mock Service Workers.

First tests done with `add-weapon-control-tests.js` and `stat-block-character-edge-tests.js`.

Having tests on top of MSW and StatBlock seems to be almost like a system-level integration test. Very nice!

## Class components to React Hooks?

https://react.dev/reference/react/Component#alternatives

Class components are `legacy` and I expect support for them will disappear.

At least `useEffect()` hook was not very easy to use with the class components.

## TODO: JavaScript to TypeScript or whatever is the latest rage
