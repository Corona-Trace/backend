#!/bin/bash
bq mk --external_table_definition=./traces.json coronatrace_prod.traces 
bq mk --external_table_definition=./users.json coronatrace_prod.users
