#!/bin/bash
# Several QA stills in one go: ./stills.sh <CompId> <frame> [<frame> ...]  -> ../qa/stills/<CompId>-<frame>.jpg
# Then stack them into a contact sheet (python3 + PIL) and Read it.
cd "$(dirname "$0")"
COMP=$1; shift
for F in "$@"; do ./still.sh "$COMP" "$F" "$PWD/../qa/stills/$COMP-$F.jpg"; done
