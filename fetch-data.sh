#!/bin/sh

UDATA='https://unicode.org/Public/UNIDATA/UnicodeData.txt'
BLOCK='https://unicode.org/Public/UNIDATA/Blocks.txt'

cmd=curl

if ! command -v curl &>/dev/null ; then
  cmd='wget -qO-'
  if ! command -v wget &>/dev/null ; then
    echo "Could not fetch unicode data from"
    echo "$url"
    echo
    echo "Please install curl or wget."
    exit 1
  fi
fi

$cmd "$UDATA" > UnicodeData.txt
$cmd "$BLOCK" > Blocks.txt

