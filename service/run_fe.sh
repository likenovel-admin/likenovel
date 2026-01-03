#!/bin/bash

sudo chown -R ln-admin:ln-admin /home/ln-admin/likenovel/service
sudo chmod -R 700 /home/ln-admin/likenovel/service

cd /home/ln-admin/likenovel/service

pm2 restart start_service.sh

exit 0

