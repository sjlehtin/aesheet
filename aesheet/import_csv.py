from django.core.management import setup_environ
import settings
setup_environ(settings)

import csv
import sys

from sheet.models import *

data = csv.reader(open(sys.argv[1]))
header = data.next()

header = [yy.lower() for yy in ['_'.join(xx.split(' ')) for xx in header]]

for row in data:
    mdl = WeaponTemplate()
    for (hh, index) in zip(header, range(len(header))):
        print "%s: %s" % (hh, row[index])
        setattr(mdl, hh, row[index])
    print mdl
    if True:
        try:
            mdl.save()
        except Exception as e:
            print "Could not save %s: %s" % (mdl, e)

