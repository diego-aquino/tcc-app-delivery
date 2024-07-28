#!/usr/bin/env bash

set -e

cd ../api-mocking-app-delivery

cp -r ../tcc-app-delivery .
rm -rf tcc-app-delivery/.git
cp -rT tcc-app-delivery .

rm -rf tcc-app-delivery scripts

git add .
git commit --amend --no-edit
