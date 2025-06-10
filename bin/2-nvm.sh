#!/bin/bash

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash

bash

nvm install --lts

sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/node" "/usr/local/bin/node"
sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/npm" "/usr/local/bin/npm"
sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/npx" "/usr/local/bin/npx"

sudo npm install -g pnpm pm2 
pm2 startup