#!/bin/bash

if type update-alternatives 2>/dev/null >&1; then
    # Remove previous link if it doesn't use update-alternatives
    if [ -L '/usr/bin/nodedrop' -a -e '/usr/bin/nodedrop' -a "`readlink '/usr/bin/nodedrop'`" != '/etc/alternatives/nodedrop' ]; then
        rm -f '/usr/bin/nodedrop'
    fi
    update-alternatives --install '/usr/bin/nodedrop' 'nodedrop' '/opt/NodeDrop/nodedrop' 100 || ln -sf '/opt/NodeDrop/nodedrop' '/usr/bin/nodedrop'
else
    ln -sf '/opt/NodeDrop/nodedrop' '/usr/bin/nodedrop'
fi

chmod 4755 '/opt/NodeDrop/chrome-sandbox' || true

if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi

if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi
