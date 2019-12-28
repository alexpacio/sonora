#!/bin/bash

rsync --delete -avz --exclude=node_modules --exclude=dist --exclude=package-lock.json ./ pi@192.168.0.XXX:/home/pi/tv-remote-control/