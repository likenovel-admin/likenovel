#!/bin/bash

sudo chown -R ln-admin:ln-admin /home/ln-admin/likenovel/cms
sudo chmod -R 700 /home/ln-admin/likenovel/cms

cd /home/ln-admin/likenovel/cms

pm2 restart start_cms.sh

exit 0

