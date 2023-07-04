NB: Obsolete, nuke after getting the stuff natively working with React 18 and
MockServiceWorker.

Run tests with "npm test", with a possible file name selector.

I don't like the .afterLoad construct.  I'm using jasmine 2.0 instead of
1.2 with the jest here as it supported the passing of a "done" callback to
the test functions.

The tests seem slower with this than I'd like.  I need to update jest to a
current version, see what breaks and study how the async stuff *should* be
done.  .toHaveBeenCalledWith seems to broken in my setup with jest mocks.

Many REST API integration tests are missing.

This does not seem to work in the test files:

  import {TableWrapper} from './testutils';

whereas this works:

  const TableWrapper = require('./testutils').TableWrapper;

Find out why.