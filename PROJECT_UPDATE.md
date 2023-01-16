# Updating the project

I'm writing down what I updated when I started to work on this project again
just before my X-mas holidays before our Sunday AEMR game on 2021-12-19.

## Update to current python

On my laptop, this means updating my python with `pyenv` from `brew`. Target is to use Python 3.10, as that is the current one.

## TODO: Update to current Django
## TODO: Update all packages 
## TODO: Updato to current React
## TODO: Move to new server/Lambda/etc
## TODO: JavaScript to TypeScript or whatever is the latest rage
## TODO: staticfiles and uploads to S3
https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html
## TODO: Use src layout for package

## Updating to current React etc

`npm update` and `npm audit fix --force` updated `package.json` and friends.

I'm left with a bunch of warnings about anti-patterns in React usage, those 
need to be sorted also.

### React 18

`react-dom/test-utils` starts to generate warnings. It is being retired in favor of [Testing Library](https://testing-library.com/docs/react-testing-library/).

## Nuked Pipfile

It was only causing problems.
