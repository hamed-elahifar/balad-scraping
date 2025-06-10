#!/bin/bash

wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb # this will return error, but it is necessary
sudo apt --fix-broken -y install
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt autoremove -y