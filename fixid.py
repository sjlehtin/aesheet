#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
A script to fix sequence ids in postgres.  These might get out of sync when
importing data to the database.

Usage: fixid.py [options]

Options:
  --verbose, -v    Verbose mode.
"""
import psycopg2
from docopt import docopt

def list_sequences(conn):
    with conn.cursor() as cur:
        cur.execute("""SELECT sequence_name
           FROM information_schema.sequences
           WHERE sequence_schema = 'public'""")

        rows = cur.fetchall()

        for row in rows:
            yield row[0]


if __name__ == "__main__":
    args = docopt(__doc__)
    with open('auth') as fp:
        user, password = fp.readline().split(" ", 1)
        user = user.strip()
        password = password.strip()

    def verbose(msg):
        if args['--verbose']:
            print msg

    with psycopg2.connect(database='sheet', host="127.0.0.1",
        user=user, password=password) as conn:
        for seq in list_sequences(conn):
            verbose(seq)
            with conn.cursor() as cur:
                table = seq[:-7]
                # Table name is generated from the sequence name, it does not
                # come from an external source.
                query = "SELECT MAX(id) from " + table + ";"
                cur.execute(query)
                max_id = cur.fetchall()[0][0]
                verbose("Max id: {0}".format(max_id))
                query = "SELECT last_value from " + seq + ";"
                cur.execute(query)
                last_value = cur.fetchall()[0][0]
                verbose("Last value: {0}".format(last_value))
                if last_value < max_id:
                    print "{table} id has an inconsistence (max: {max_id}, " \
                          "last value: {last_value}".format(locals())
                #cur.execute("""SELECT nextval(%s)""")
