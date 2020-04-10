#!/bin/bash

instance=${1:-localhost:8086}

# create checkpoints table
cbt -instance $instance createtable checkpoints
cbt -instance $instance createfamily checkpoints payload  #run_at

# create users table
cbt -instance $instance createtable users
cbt -instance $instance createfamily users status  #confirmed,informed_time
cbt -instance $instance createfamily users push_notification_token #push_notification_token
cbt -instance $instance createfamily users interest_areas #interest_areas is a list

# insert test data
user1=$(uuidgen)
cbt -instance $instance set users $user1 status:confirmed=false status:informed_time="$(node -e 'console.log(new Date().toISOString())')" interest_areas:0="852f5b6bfffffff" interest_areas:1="852e74b7fffffff" push_notification_token:token="token_$user1"

user2=$(uuidgen)
cbt -instance $instance set users $user2 status:confirmed=true status:informed_time="$(node -e 'console.log(new Date().toISOString())')" interest_areas:0="852f5b6bfffffff" interest_areas:1="852e74b7fffffff" push_notification_token:token="token_$user2"

# create traces table
cbt -instance $instance createtable traces
cbt -instance $instance createfamily traces location #lat,lon,accuracy,speed,heading,altitude
cbt -instance $instance createfamily traces activity #type=still|on_foot|walking...,confidence

time=$(node -e 'console.log(new Date().toISOString())')
cbt -instance $instance set traces "$time#$user1" location:lat=52.3842352 location:lon=4.9139242
