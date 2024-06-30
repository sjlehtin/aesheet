#!/bin/sh

set -e

server=$1
env=${2:-dev}

version=$(jq -r .version package.json)

package="aesheet-${version}-full.tar.xz"

if [ ! -f "$package" ]; then
  echo "Package $package does not exist"
  exit 1
fi

scp $package $server:
ssh $server "tar zxvf $package && cd /var/www/aesheet/$env && ../deploy.sh ~/aesheet-${version}"
