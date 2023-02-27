#!/bin/bash

# Set the directory where the JSON files are located
SCRIPT_DIR=$(cd "$(dirname "$1")" >/dev/null 2>&1 && pwd -P)
files_array=$(find $SCRIPT_DIR/packages -name package.json -type f -maxdepth 2)

for json_file in ${files_array[@]}; do
  echo "Updating package json with public registry: $json_file"
  # Read the contents of the JSON file into a variable
  file_content=$(<"$json_file")
  echo $json_string
  #  # Update the JSON file by adding a new field to each object
  #  # in the JSON file and set its value to "hello world"
  updated_json_string=$(echo "$file_content" | jq '.publishConfig = { "access": "public", "@metis-data:registry": "https://registry.npmjs.org/" }')

  git update-index --assume-unchanged "$json_file"

  #  # Write the updated JSON string back to the file
  echo "$updated_json_string" >"$json_file"
done

for json_file in ${files_array[@]}; do
  git update-index --assume-unchanged "$json_file"
done
