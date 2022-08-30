#!/bin/sh

set -e

if [ ! -f Blocks.txt ] ; then
  ./fetch-data.sh
fi

sed '1,/BLOCKS =/!d' main.js > .main.js
sed -E  -f - Blocks.txt >> .main.js <<EOF
/^\\d*$/d
/^#/d
s/\\.\\./,/
s/ /,'/
s/^([[:xdigit:]]+)/    [0x\\1/g
s/([[:xdigit:]]+);/0x\\1/g
s/$/'],/
EOF
sed '/--BLOCKS--/,$!d' main.js >> .main.js
mv .main.js main.js

