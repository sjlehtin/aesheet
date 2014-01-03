# Django settings for aesheet project.

import os
from django.conf.global_settings import TEMPLATE_CONTEXT_PROCESSORS

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    ('Sami J. Lehtinen', 'sjl@iki.fi'),
)

MANAGERS = ADMINS

ROOT_URL = os.environ.get('ROOT_URL')
if not ROOT_URL:
    ROOT_URL = "/"
PRODUCTION = True if os.environ.get('PRODUCTION') else False

LOGIN_URL = ROOT_URL + "accounts/login/"
LOGIN_REDIRECT_URL = ROOT_URL + "accounts/profile/"

SOUTH_TESTS_MIGRATE = False

BASEDIR = os.path.dirname(__file__)
DBHOST = os.getenv("DBHOST", default='127.0.0.1')

if PRODUCTION:

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
    DEBUG_TOOLBAR_ENABLED = False
else:
    DB_ENGINE = 'django.db.backends.sqlite3'
    DB_NAME = os.path.join(os.path.dirname(__file__), 'db/sheet.db')
    (USER, PASSWORD) = "", ""
    DEBUG_TOOLBAR_ENABLED = True

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

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
#STATIC_ROOT = ''
STATIC_ROOT =  os.path.join(os.path.dirname(__file__), "static")

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

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'wDbImXEkn/v9oAnEjxquj/3u9DY'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    'django.template.loaders.eggs.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS += (
    "context_processors.variables",
    "django.core.context_processors.request",
    )

MIDDLEWARE_CLASSES = (
    'loginreqd.RequireLoginMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'profiling.ProfileMiddleware',
    'profiling.MemoryProfileMiddleware',
)

if DEBUG_TOOLBAR_ENABLED:
    MIDDLEWARE_CLASSES += ('debug_toolbar.middleware.DebugToolbarMiddleware',)
    INTERNAL_IPS = ("127.0.0.1",)

ROOT_URLCONF = 'urls'

import sys

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or
    # "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(os.path.dirname(__file__), "templates")
)

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
    # Uncomment the next line to enable the admin:
    'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    'django.contrib.admindocs',
    'south',
    'sheet',
    'profiling',
    'django.contrib.humanize',
)

if DEBUG_TOOLBAR_ENABLED:
    INSTALLED_APPS += ('debug_toolbar',)

DEBUG_TOOLBAR_PANELS = (
    'debug_toolbar.panels.version.VersionDebugPanel',
    'debug_toolbar.panels.timer.TimerDebugPanel',
    'debug_toolbar.panels.settings_vars.SettingsVarsDebugPanel',
    'debug_toolbar.panels.headers.HeaderDebugPanel',
    'debug_toolbar.panels.request_vars.RequestVarsDebugPanel',
    'debug_toolbar.panels.sql.SQLDebugPanel',
    'debug_toolbar.panels.template.TemplateDebugPanel',
    #'debug_toolbar.panels.cache.CacheDebugPanel',
    'debug_toolbar.panels.signals.SignalDebugPanel',
    'debug_toolbar.panels.logger.LoggingPanel',
    )

if os.getenv("INTERCEPT_REDIRECTS"):
    INTERCEPT_REDIRECTS = True
else:
    INTERCEPT_REDIRECTS = False

DEBUG_TOOLBAR_CONFIG = {
    'INTERCEPT_REDIRECTS': INTERCEPT_REDIRECTS
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
            'django.db' : {
                'handlers' : ['console'],
                'level' : 'DEBUG'
            },
            '' : {
                'handlers' : ['console'],
                'level' : 'DEBUG'
            }
        },
    }
