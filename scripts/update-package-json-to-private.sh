#!/bin/bash

update_lerna_version_file_content=$(cat lerna.json | jq '.command.publish.registry = "https://npm.pkg.github.com/metis-data"')
echo $update_lerna_version_file_content >lerna.json
git update-index --assume-unchanged lerna.json
