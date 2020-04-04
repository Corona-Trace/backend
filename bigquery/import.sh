#!/bin/bash
bq mk --external_table_definition=./traces.json coronatrace_prod.traces 
