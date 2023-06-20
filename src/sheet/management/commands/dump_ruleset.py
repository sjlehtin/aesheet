from django.core.management.base import BaseCommand
from django.core.management import call_command
import sys
import sheet.models as m


class Command(BaseCommand):
    help = 'Dump ruleset'

    def add_arguments(self, parser):
        parser.add_argument('models', nargs='*', type=str)
        parser.add_argument(
            '--list-only', dest='list_only', action='store_true',
            default=False, help='List the exportable rule models',
        )

    def handle(self, *args, **options):
        if options['list_only']:
            print('\n'.join(m.EXPORTABLE_MODELS))
            return

        print("Dumping ruleset for {}".format(' '.join(options['models']) or "all"),
              file=sys.stderr)
        models = options['models'] or m.EXPORTABLE_MODELS

        models = ['sheet.{}'.format(model) for model in models]
        call_command('dumpdata', *models)
