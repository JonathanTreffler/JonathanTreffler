#!/bin/bash
git_url=$1

if [ "$git_url" != "" ]; then

    cd projects
    git submodule add $git_url

    echo "Sucessfully added repository $git_url"
    echo "To deploy to github commit the changes"
else
    echo "ERROR: No url specified"
    exit 1;
fi