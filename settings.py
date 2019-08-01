# Django settings for aesheet project.

import os
import sys

ADMINS = (
    ('Sami J. Lehtinen', 'sjl@iki.fi'),
)

MANAGERS = ADMINS

ROOT_URL = os.environ.get('ROOT_URL')
if not ROOT_URL:
    ROOT_URL = "/"

LOGIN_URL = ROOT_URL + "accounts/login/"
LOGIN_REDIRECT_URL = ROOT_URL + "accounts/profile/"

DBHOST = os.getenv("DBHOST", default='127.0.0.1')

ALLOWED_HOSTS = ["devsheet.liskot.org", "aesheet.liskot.org",
                 'localhost', '127.0.0.1', '[::1]']

if 'ALLOWED_HOSTS' in os.environ:
    ALLOWED_HOSTS += os.environ['ALLOWED_HOSTS'].split(',')

BASEDIR = os.path.dirname(__file__)
PRODUCTION = os.path.exists(os.path.join(BASEDIR, "auth"))
if 'PRODUCTION' in os.environ:
    PRODUCTION = True if os.environ.get('PRODUCTION') else False

DEBUG = False
DEBUG_TOOLBAR_ENABLED = False

if 'RDS_HOSTNAME' in os.environ:
    DB_ENGINE = 'django.db.backends.postgresql_psycopg2'
    DB_NAME = os.environ['RDS_DB_NAME']
    USER = os.environ['RDS_USERNAME']
    PASSWORD = os.environ['RDS_PASSWORD']
    DBHOST = os.environ['RDS_HOSTNAME']
    PORT = os.environ['RDS_PORT']
    SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
elif PRODUCTION:

    DB_ENGINE = 'django.db.backends.postgresql_psycopg2'
    # Allow overriding database with a file and environment variable.
    DB_NAME='sheet'
    try:
        with open(os.path.join(BASEDIR, "DATABASE")) as fp:
            DB_NAME = fp.read().strip()
    except IOError:
        pass
    DB_NAME = os.getenv("DB_NAME", DB_NAME)
    f = open(os.path.join(BASEDIR, "auth"), "r")
    auth_details = f.read()
    (USER, PASSWORD) = auth_details.strip().split()

    SECRET_KEY = open(os.path.join(BASEDIR, "secret"), "r").read().strip()

else:
    DB_ENGINE = 'django.db.backends.sqlite3'
    DB_NAME = os.path.join(os.path.dirname(__file__), 'sql.db')
    DB_NAME = os.getenv("DB_NAME", DB_NAME)
    (USER, PASSWORD) = "", ""
    DEBUG_TOOLBAR_ENABLED = True
    DEBUG = True
    if os.path.exists(os.path.join(BASEDIR, "secret")):
        SECRET_KEY = open(os.path.join(BASEDIR, "secret"), "r").read().strip()

val = os.getenv('DEBUG_TOOLBAR')
if val is not None:
    if val in ["1", "yes"]:
        val = True
    else:
        val = False
    DEBUG_TOOLBAR_ENABLED = val

try:
    import debug_toolbar
except ImportError:
    DEBUG_TOOLBAR_ENABLED = False

DATABASES = {
    'default': {
        'ENGINE': DB_ENGINE,
        'ATOMIC_REQUESTS': True,
        'NAME': DB_NAME, # Or path to database file if using sqlite3.
        'USER': USER,                      # Not used with sqlite3.
        'PASSWORD': PASSWORD,     # Not used with sqlite3.
        'HOST': DBHOST,                  # Set to empty string for
                                         # localhost. Not used with
                                         # sqlite3.
        'PORT': '',                      # Set to empty string for
                                         # default. Not used with
                                         # sqlite3.
    }

}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Helsinki'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

LANGUAGES = [
    ('en', 'English'),
]

SITE_ID = 1

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = os.path.join(os.path.dirname(__file__), "upload")

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = '/media/'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
#STATIC_ROOT = ''
STATIC_ROOT = os.path.join(os.path.dirname(__file__), "static")

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = ROOT_URL + 'static/'

# URL prefix for admin static files -- CSS, JavaScript and images.
# Make sure to use a trailing slash.
# Examples: "http://foo.com/static/admin/", "/static/admin/".
ADMIN_MEDIA_PREFIX = ROOT_URL + 'static/admin/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

MIDDLEWARE = [
    'loginreqd.RequireLoginMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

if DEBUG_TOOLBAR_ENABLED:
    MIDDLEWARE += ('debug_toolbar.middleware.DebugToolbarMiddleware',)
    INTERNAL_IPS = ("127.0.0.1",)

MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'

ROOT_URLCONF = 'urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(os.path.dirname(__file__), "templates"),],
        'APP_DIRS': True,
        'OPTIONS': {'context_processors':
        [
                # default
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',

                # extra.
                "context_processors.variables",
                         "django.template.context_processors.request",],
                     }
    },
]

LOGIN_REQUIRED_URLS = (
    r'(.*)$',
)

LOGIN_REQUIRED_URLS_EXCEPTIONS = (
    ROOT_URL + r'accounts/login/.*$',
    ROOT_URL + r'accounts/logout/.*$'
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'django.contrib.admindocs',
    'widget_tweaks',
    'sheet',
    'django.contrib.humanize',
    'rest_framework',
)

if DEBUG_TOOLBAR_ENABLED:
    INSTALLED_APPS += ('debug_toolbar',)

DEBUG_TOOLBAR_CONFIG = {
    }

if os.getenv('LOG_TO_CONSOLE'):
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'simple': {
                'format': '%(levelname).1s[%(relativeCreated)d] '
                '%(filename)s:%(lineno)s: %(message)s'
            },
        },
        'handlers': {
            'console':{
                'level':'DEBUG',
                'class':'logging.StreamHandler',
                'formatter': 'simple'
            },
        },
        'loggers': {
            'sheet' : {
                'handlers' : ['console'],
                'level' : 'DEBUG'
                },
            'django' : {
                'handlers' : ['console'],
                'level' : 'INFO'
            },
            'factory': {
                'handlers' : ['console'],
                'level' : 'INFO'
            },
            '' : {
                'handlers' : ['console'],
                'level' : 'DEBUG'
            }
        },
    }
