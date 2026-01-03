#!/bin/bash

sudo chown -R ln-admin:ln-admin /home/ln-admin/likenovel/partner
sudo chmod -R 700 /home/ln-admin/likenovel/partner

cd /home/ln-admin/likenovel/partner

pm2 restart start_partner.sh

exit 0

