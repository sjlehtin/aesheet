from django.utils import simplejson
from dajaxice.core import dajaxice_functions

def myexample(request):
    return simplejson.dumps({'message':'Hello World'})
dajaxice_functions.register(myexample)

from dajax.core import Dajax
from dajaxice.decorators import dajaxice_register

@dajaxice_register
def multiply(request, a, b):
    print "dajax foo!"
    dajax = Dajax()
    result = int(a) * int(b)
    dajax.assign('#result','value',str(result))
    return dajax.json()

