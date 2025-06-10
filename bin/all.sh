#!/bin/bash

# Get the directory of this script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Loop through all .sh files in the directory, excluding this script
for script in "$DIR"/*.sh; do
    # Skip if the script is this script itself
    if [ "$script" != "$DIR/$(basename "${BASH_SOURCE[0]}")" ]; then
        echo "Running $script..."
        bash "$script"
        # Optionally, check the exit status
        if [ $? -ne 0 ]; then
            echo "Script $script failed."
        fi
    fi
done