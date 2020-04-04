#!/bin/bash

instance=${1:-localhost:8086}

# create users table
cbt -instance $instance createtable users
cbt -instance $instance createfamily users status 
cbt -instance $instance createfamily users interest_areas

# insert test data
user1=$(uuidgen)
cbt -instance $instance set users $user1 status:confirmed=false status:informed_time="$(node -e 'console.log(new Date().toISOString())')" interest_areas:0="852f5b6bfffffff" interest_areas:1="852e74b7fffffff"

# create traces table
cbt -instance $instance createtable traces
cbt -instance $instance createfamily traces location

time=$(node -e 'console.log(new Date().toISOString())')
cbt -instance $instance set traces "$time#$user1" location:lon=52.3842352 location:lat=4.9139242
