#!/bin/bash

CONTAINER_NAME="workspace-postgres"
IMAGE_NAME="postgres:16-alpine"
DB_USER="workspace"
DB_PASSWORD="workspace_dev"
DB_NAME="postgres"
DB_PORT="5432"

log() {
  echo "[change-db-state.sh] $1"
}

get_container_status() {
  docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null
}

action=$1

if [ "$action" == "--up" ]; then
  status=$(get_container_status)
  if [ "$status" == "running" ]; then
    log "Database container '$CONTAINER_NAME' is already running."
  elif [ "$status" == "exited" ]; then
    log "Database container '$CONTAINER_NAME' found but stopped. Starting it..."
    docker start "$CONTAINER_NAME"
    if [ $? -eq 0 ]; then
      log "Database container '$CONTAINER_NAME' started successfully."
    else
      log "Error starting database container '$CONTAINER_NAME'."
      exit 1
    fi
  else # Container does not exist
    log "Database container '$CONTAINER_NAME' not found. Creating and starting it..."
    docker run -d --name "$CONTAINER_NAME" 
      -e POSTGRES_USER="$DB_USER" 
      -e POSTGRES_PASSWORD="$DB_PASSWORD" 
      -e POSTGRES_DB="$DB_NAME" 
      -p "$DB_PORT":"$DB_PORT" 
      "$IMAGE_NAME"
    if [ $? -eq 0 ]; then
      log "Database container '$CONTAINER_NAME' created and started successfully."
    else
      log "Error creating and starting database container '$CONTAINER_NAME'."
      exit 1
    fi
  fi
elif [ "$action" == "--down" ]; then
  status=$(get_container_status)
  if [ "$status" == "running" ]; then
    log "Database container '$CONTAINER_NAME' is running. Stopping it..."
    docker stop "$CONTAINER_NAME"
    if [ $? -eq 0 ]; then
      log "Database container '$CONTAINER_NAME' stopped successfully."
    else
      log "Error stopping database container '$CONTAINER_NAME'."
      exit 1
    fi
  elif [ "$status" == "exited" ]; then
    log "Database container '$CONTAINER_NAME' is already stopped."
  else # Container does not exist
    log "Database container '$CONTAINER_NAME' does not exist."
  fi
else
  log "Usage: change-db-state.sh --up | --down"
  exit 1
fi
