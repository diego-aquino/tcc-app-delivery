#!/usr/bin/env bash

set -e

cd ../api-mocking-app-delivery

rsync ../tcc-app-delivery/ . \
  --archive \
  --verbose \
  --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude scripts
